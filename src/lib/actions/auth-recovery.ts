"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "../prisma";
import { forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "../validation";
import { generateAndStoreOtp, verifyOtpCode, invalidateUserOtps } from "../otp";
import { sendOtpEmail } from "../email";
import { sendOtpWhatsApp, maskPhoneNumber } from "../whatsapp";
import { auth } from "../auth";
import type { FormState } from "../form";
import type { OtpMethod } from "@prisma/client";

export interface RecoveryRequestResult extends FormState {
  data?: {
    identifier: string;
    method: "EMAIL" | "WHATSAPP";
    expiresMinutes?: number;
    maskedTarget?: string;
    retryAfter?: number;
  };
}

export async function requestPasswordRecoveryAction(
  _prev: RecoveryRequestResult | undefined,
  formData: FormData
): Promise<RecoveryRequestResult> {
  const parsed = forgotPasswordSchema.safeParse({
    identifier: formData.get("identifier"),
    method: formData.get("method") || "EMAIL",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string") fieldErrors[k] = issue.message;
    }
    return { ok: false, message: "Please enter a valid email or phone number.", fieldErrors };
  }

  const { identifier, method } = parsed.data;
  const cleanIdentifier = identifier.trim().toLowerCase();

  // Look up user by email or phone
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanIdentifier },
        { phone: identifier.trim() },
        { phone: cleanIdentifier },
      ],
    },
    select: { id: true, name: true, email: true, phone: true, isActive: true },
  });

  if (!user || !user.isActive) {
    // Generic message to avoid leaking which accounts exist
    return {
      ok: false,
      message: "If an account exists with this information, a verification code has been sent. Please check your email or phone.",
      fieldErrors: {},
    };
  }

  if (method === "WHATSAPP" && !user.phone) {
    return {
      ok: false,
      message: "No phone number is linked to this account for WhatsApp verification. Please use Email verification instead.",
      fieldErrors: { method: "No phone number on file" },
    };
  }

  // Get request metadata for rate limiting
  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "unknown";
  const userAgent = headerList.get("user-agent") || "unknown";

  // Determine the target identifier based on method
  const targetIdentifier = method === "EMAIL" ? user.email : user.phone!;
  const otpMethod: OtpMethod = method === "EMAIL" ? "EMAIL" : "WHATSAPP";

  // Generate and store OTP
  const otpResult = await generateAndStoreOtp({
    userId: user.id,
    identifier: targetIdentifier,
    method: otpMethod,
    purpose: "PASSWORD_RESET",
    ipAddress,
    userAgent,
  });

  if (!otpResult.success || !otpResult.otp) {
    return {
      ok: false,
      message: otpResult.error || "Failed to generate verification code. Please try again.",
      data: otpResult.retryAfter
        ? {
            identifier: targetIdentifier,
            method,
            retryAfter: otpResult.retryAfter,
          }
        : undefined,
    };
  }

  // Send OTP via the selected method
  let sendResult: { success: boolean; error?: string };
  if (method === "EMAIL") {
    sendResult = await sendOtpEmail({
      to: targetIdentifier,
      userName: user.name,
      otp: otpResult.otp,
      expiresMinutes: 15,
      purpose: "password_reset",
    });
  } else {
    sendResult = await sendOtpWhatsApp({
      to: targetIdentifier,
      userName: user.name,
      otp: otpResult.otp,
      expiresMinutes: 15,
      purpose: "password_reset",
    });
  }

  if (!sendResult.success) {
    console.error("Failed to send OTP:", sendResult.error);
    return {
      ok: false,
      message: `Verification code generated but failed to send via ${method === "EMAIL" ? "email" : "WhatsApp"}. Please try again or contact support.`,
      fieldErrors: {},
    };
  }

  // Mask the target for display
  const maskedTarget =
    method === "EMAIL" ? maskEmail(user.email) : maskPhoneNumber(user.phone || "");

  return {
    ok: true,
    message:
      method === "WHATSAPP"
        ? `Verification code sent to your WhatsApp (${maskedTarget}). Please check your messages.`
        : `Verification code sent to your email (${maskedTarget}). Please check your inbox and spam folder.`,
    data: {
      identifier: targetIdentifier,
      method,
      expiresMinutes: 15,
      maskedTarget,
    },
  };
}

export async function resetPasswordWithOtpAction(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    identifier: formData.get("identifier"),
    otp: formData.get("otp"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string") fieldErrors[k] = issue.message;
    }
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  const { identifier, otp, newPassword } = parsed.data;

  // Verify the OTP
  const verification = await verifyOtpCode({
    identifier,
    otp,
    purpose: "PASSWORD_RESET",
  });

  if (!verification.success) {
    return {
      ok: false,
      message: verification.message,
      fieldErrors: { otp: verification.message },
    };
  }

  if (!verification.valid) {
    return {
      ok: false,
      message: verification.message,
      fieldErrors: { otp: verification.message },
    };
  }

  if (!verification.userId) {
    return {
      ok: false,
      message: "Invalid verification. Please request a new code.",
      fieldErrors: { otp: "Invalid verification" },
    };
  }

  // Update the password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: verification.userId },
    data: { password: hashedPassword },
  });

  // Invalidate all remaining OTPs for this user
  await invalidateUserOtps(verification.userId, "PASSWORD_RESET");

  revalidatePath("/login");
  return {
    ok: true,
    message: "Password reset successful! You can now log in with your new password.",
  };
}

export async function changePasswordInDashboardAction(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "You must be signed in to change your password." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string") fieldErrors[k] = issue.message;
    }
    return { ok: false, message: "Please correct the errors below.", fieldErrors };
  }

  const userId = Number(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user) {
    return { ok: false, message: "User account not found." };
  }

  const isCurrentValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!isCurrentValid) {
    return {
      ok: false,
      message: "Current password is incorrect.",
      fieldErrors: { currentPassword: "Incorrect password" },
    };
  }

  const hashedNew = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNew },
  });

  revalidatePath("/dashboard");

  return {
    ok: true,
    message: "Password changed successfully! Keep your credentials safe.",
  };
}

function maskEmail(email: string): string {
  const parts = email.split("@");
  const namePart = parts[0] || "";
  const maskedName =
    namePart.length > 3
      ? `${namePart.slice(0, 2)}***${namePart.slice(-1)}`
      : `${namePart.slice(0, 1)}***`;
  return `${maskedName}@${parts[1] || "domain.com"}`;
}
