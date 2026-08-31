"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "../prisma";
import { auth } from "../auth";
import {
  getSmsBalance,
  toggleSmsService,
  sendTestSms,
} from "../sms-balance";
import { createPayment } from "../bkash";

export async function getSmsBalanceAction() {
  const session = await auth();
  if (!session?.user) return null;

  const doctor = await prisma.doctor.findFirst({
    where: { userId: Number(session.user.id) },
  });
  if (!doctor) return null;

  const balance = await getSmsBalance(doctor.id);
  const transactions = await prisma.smsTransaction.findMany({
    where: { balance: { doctorId: doctor.id } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    balance: balance
      ? {
          ...balance,
          remaining: balance.totalCredits - balance.usedCredits,
        }
      : null,
    transactions,
  };
}

export async function toggleSmsAction(enabled: boolean) {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const doctor = await prisma.doctor.findFirst({
    where: { userId: Number(session.user.id) },
  });
  if (!doctor) return { success: false, message: "No doctor profile" };

  const result = await toggleSmsService(doctor.id, enabled);
  revalidatePath("/dashboard/sms");
  return { success: result.success, message: result.message };
}

export async function sendTestSmsAction(phone: string) {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const doctor = await prisma.doctor.findFirst({
    where: { userId: Number(session.user.id) },
  });
  if (!doctor) return { success: false, message: "No doctor profile" };

  if (!phone || phone.length < 10) {
    return { success: false, message: "Please enter a valid phone number" };
  }

  const result = await sendTestSms(doctor.id, phone);
  return { success: result.success, message: result.message };
}

/**
 * Initiate a bKash payment for SMS top-up.
 * Creates a payment and returns the bKash URL where customer completes payment.
 */
export async function initiateBkashTopupAction(input: {
  credits: number;
  costBdt: number;
}) {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const doctor = await prisma.doctor.findFirst({
    where: { userId: Number(session.user.id) },
  });
  if (!doctor) return { success: false, message: "No doctor profile" };

  // Get user
  const userId = Number(session.user.id);

  // Create bKash payment
  const invoiceNumber = `SMS-TOPUP-${userId}-${Date.now()}`;
  const result = await createPayment({
    amount: input.costBdt,
    invoiceNumber,
  });

  if (!result.success || !result.paymentID || !result.bkashURL) {
    return {
      success: false,
      message: result.error || "Failed to create bKash payment",
    };
  }

  // Save pending payment to database
  await prisma.pendingBkashPayment.create({
    data: {
      paymentId: result.paymentID,
      userId,
      credits: input.credits,
      costBdt: input.costBdt,
      invoiceNumber,
      status: "PENDING",
    },
  });

  return {
    success: true,
    message: "Redirecting to bKash...",
    data: {
      bkashURL: result.bkashURL,
      paymentID: result.paymentID,
    },
  };
}

/**
 * Manual confirmation (for testing or if bKash webhook fails).
 * Doctors can enter their bKash Transaction ID and we'll add credits.
 */

