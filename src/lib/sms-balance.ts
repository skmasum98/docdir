import { prisma } from "./prisma";
import { sendSms } from "./sms";

const SMS_COST_PER_SMS_BDT = 0.5;
const SMS_LOW_BALANCE_THRESHOLD = 10;

/**
 * Get the SMS balance record for a doctor (creating if doesn't exist).
 */
export async function getSmsBalance(doctorId: number) {
  let balance = await prisma.smsBalance.findUnique({
    where: { doctorId },
  });

  if (!balance) {
    // Get the userId from the doctor
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { userId: true },
    });
    if (!doctor?.userId) return null;

    balance = await prisma.smsBalance.create({
      data: {
        userId: doctor.userId,
        doctorId,
        totalCredits: 0,
        usedCredits: 0,
      },
    });
  }

  return balance;
}

/**
 * Check if SMS is enabled for a doctor (toggle on, has balance).
 */
export async function isSmsEnabled(doctorId: number): Promise<boolean> {
  const balance = await getSmsBalance(doctorId);
  if (!balance) return false;
  if (!balance.smsEnabled) return false;
  const remaining = balance.totalCredits - balance.usedCredits;
  return remaining > 0;
}

/**
 * Toggle SMS service for a doctor.
 */
export async function toggleSmsService(doctorId: number, enabled: boolean): Promise<{ success: boolean; message: string }> {
  await getSmsBalance(doctorId);
  await prisma.smsBalance.update({
    where: { doctorId },
    data: { smsEnabled: enabled },
  });
  return {
    success: true,
    message: enabled ? "SMS notifications enabled" : "SMS notifications disabled",
  };
}

/**
 * Decrement SMS credit when sending. Auto-disables if balance is 0.
 */
export async function decrementSmsCredit(doctorId: number, credits: number, description: string): Promise<boolean> {
  const balance = await getSmsBalance(doctorId);
  if (!balance) return false;
  if (!balance.smsEnabled) return false;

  const remaining = balance.totalCredits - balance.usedCredits;
  if (remaining < credits) {
    // Auto-disable if no balance
    await prisma.smsBalance.update({
      where: { doctorId },
      data: {
        smsEnabled: false,
        autoDisableAt: new Date(),
      },
    });
    return false;
  }

  // Deduct credit and log transaction
  await prisma.$transaction([
    prisma.smsBalance.update({
      where: { doctorId },
      data: { usedCredits: { increment: credits } },
    }),
    prisma.smsTransaction.create({
      data: {
        userId: balance.userId,
        balanceId: balance.id,
        type: "USAGE",
        amount: -SMS_COST_PER_SMS_BDT * credits,
        credits: -credits,
        costBdt: SMS_COST_PER_SMS_BDT * credits,
        status: "COMPLETED",
        description,
      },
    }),
  ]);

  // Check if balance is now low
  const newRemaining = remaining - credits;
  if (newRemaining <= balance.lowBalanceAlert && newRemaining > 0) {
    // TODO: send low balance alert email
  }
  if (newRemaining === 0) {
    // Auto-disable when out of balance
    await prisma.smsBalance.update({
      where: { doctorId },
      data: {
        smsEnabled: false,
        autoDisableAt: new Date(),
      },
    });
  }

  return true;
}

/**
 * Add credits to doctor's SMS balance (after successful bKash payment).
 */
export async function addSmsCredits(
  userId: number,
  credits: number,
  bkashTrxId: string,
  costBdt: number
): Promise<{ success: boolean; message: string }> {
  // Get or create balance for this user (might be a doctor or facility admin)
  let balance = await prisma.smsBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    // Find doctor for this user
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

  // Update balance and create transaction record
  await prisma.$transaction([
    prisma.smsBalance.update({
      where: { userId },
      data: {
        totalCredits: { increment: credits },
        lastTopupAt: new Date(),
        // Auto-enable if it was disabled due to no balance
        smsEnabled: true,
      },
    }),
    prisma.smsTransaction.create({
      data: {
        userId,
        balanceId: balance.id,
        type: "TOPUP",
        amount: costBdt,
        credits,
        costBdt,
        bkashTrxId,
        status: "COMPLETED",
        description: `SMS top-up: ${credits} credits for ৳${costBdt}`,
        completedAt: new Date(),
      },
    }),
  ]);

  return {
    success: true,
    message: `${credits} SMS credits added successfully`,
  };
}

/**
 * Send a test SMS to verify the integration works.
 */
export async function sendTestSms(doctorId: number, phone: string): Promise<{ success: boolean; message: string }> {
  const balance = await getSmsBalance(doctorId);
  if (!balance) return { success: false, message: "No SMS balance record" };

  const remaining = balance.totalCredits - balance.usedCredits;
  if (remaining <= 0) {
    return { success: false, message: "Insufficient balance. Please top up first." };
  }

  const message = `Dr Chamber: This is a test SMS. Your SMS service is working correctly! You have ${remaining} credits remaining. -DRCHAMBER`;
  const result = await sendSms({ to: phone, message });

  if (result.success) {
    await decrementSmsCredit(doctorId, 1, "Test SMS");
    return { success: true, message: "Test SMS sent successfully" };
  } else {
    return { success: false, message: result.error || "Failed to send test SMS" };
  }
}
