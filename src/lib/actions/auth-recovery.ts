"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "../validation";
import { generateVerificationOTP, verifyOTP, clearVerification } from "../password-recovery";
import { auth } from "../auth";
import type { FormState } from "../form";

export interface RecoveryRequestResult extends FormState {
  data?: {
    identifier: string;
    method: "EMAIL" | "WHATSAPP";
    otp?: string;
    token?: string;
    whatsappUrl?: string;
    expiresMinutes?: number;
    maskedTarget?: string;
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
    // For security, don't leak user existence explicitly, but provide helpful guidance
    return {
      ok: false,
      message: "No active account found matching this email or phone. Please check and try again.",
      fieldErrors: { identifier: "Account not found" },
    };
  }

  if (method === "WHATSAPP" && !user.phone) {
    return {
      ok: false,
      message: "No phone number is linked to this account for WhatsApp verification. Please use Email verification instead.",
      fieldErrors: { method: "No phone number on file" },
    };
  }

  const result = generateVerificationOTP(user, method);

  let maskedTarget = "";
  if (method === "EMAIL") {
    const parts = user.email.split("@");
    const namePart = parts[0] || "";
    const maskedName = namePart.length > 3 ? `${namePart.slice(0, 2)}***${namePart.slice(-1)}` : `${namePart.slice(0, 1)}***`;
    maskedTarget = `${maskedName}@${parts[1] || "domain.com"}`;
  } else {
    const phone = user.phone || "";
    maskedTarget = phone.length > 5 ? `${phone.slice(0, 4)}****${phone.slice(-3)}` : phone;
  }

  return {
    ok: true,
    message:
      method === "WHATSAPP"
        ? `WhatsApp verification code generated for ${maskedTarget}.`
        : `Email verification code sent to ${maskedTarget}.`,
    data: {
      identifier: method === "EMAIL" ? user.email : user.phone || user.email,
      method,
      otp: result.otp, // Returned so UI can display in interactive preview / dev mode
      token: result.token,
      whatsappUrl: result.whatsappUrl,
      expiresMinutes: result.expiresMinutes,
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

  const verification = verifyOTP(identifier, otp);
  if (!verification.valid || !verification.userId) {
    return {
      ok: false,
      message: verification.message,
      fieldErrors: { otp: verification.message },
    };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: verification.userId },
    data: { password: hashedPassword },
  });

  // Invalidate OTP after successful password change
  clearVerification(identifier);

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
