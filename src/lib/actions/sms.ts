"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "../prisma";
import { auth } from "../auth";
import {
  getSmsBalance,
  toggleSmsService,
  sendTestSms,
  addSmsCredits,
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
export async function manualConfirmBkashTopupAction(input: {
  trxId: string;
  credits: number;
  costBdt: number;
}) {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const userId = Number(session.user.id);
  const trxId = input.trxId.trim().toUpperCase();

  if (!trxId || trxId.length < 6) {
    return { success: false, message: "Please enter a valid bKash Transaction ID" };
  }

  // Check for duplicate
  const existing = await prisma.smsTransaction.findFirst({
    where: { bkashTrxId: trxId },
  });
  if (existing) {
    return { success: false, message: "This transaction ID has already been used" };
  }

  // Get or create balance
  let balance = await prisma.smsBalance.findUnique({ where: { userId } });
  if (!balance) {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    balance = await prisma.smsBalance.create({
      data: {
        userId,
        doctorId: doctor?.id || null,
        totalCredits: 0,
        usedCredits: 0,
      },
    });
  }

  await prisma.$transaction([
    prisma.smsBalance.update({
      where: { id: balance.id },
      data: {
        totalCredits: { increment: input.credits },
        lastTopupAt: new Date(),
        smsEnabled: true,
      },
    }),
    prisma.smsTransaction.create({
      data: {
        userId,
        balanceId: balance.id,
        type: "TOPUP",
        amount: input.costBdt,
        credits: input.credits,
        costBdt: input.costBdt,
        bkashTrxId: trxId,
        status: "COMPLETED",
        description: `Manual bKash top-up: ${input.credits} credits for ৳${input.costBdt}`,
        completedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/dashboard/sms");
  return {
    success: true,
    message: `${input.credits} SMS credits added successfully!`,
  };
}
