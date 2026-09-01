import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDhakaDateString } from "@/lib/timezone";

/**
 * Cron endpoint to clean up expired slots and appointments.
 * No auto-generation - all slots are created manually.
 * 
 * Tasks:
 * - Mark past appointments as COMPLETED
 * - Delete old consumed OTPs
 * - Clean up past blocked slots
 *
 * Set the CRON_SECRET env var and pass it as Bearer token.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  // In production, require CRON_SECRET env var
  if (process.env.NODE_ENV === "production") {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("CRON_SECRET environment variable is not set in production");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }
    const expectedAuth = `Bearer ${cronSecret}`;
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mark past appointments that are still scheduled as completed
    const completedResult = await prisma.appointment.updateMany({
      where: {
        status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
        slot: { slotDate: { lt: today } },
      },
      data: { status: "COMPLETED" },
    });

    // Clean up consumed OTPs older than 24h
    const otpDeleted = await prisma.otpCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          { consumed: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
    });

    // Clean up old PENDING bKash payments (older than 1 hour)
    const bkashDeleted = await prisma.pendingBkashPayment.deleteMany({
      where: {
        status: "PENDING",
        createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    return NextResponse.json({
      success: true,
      appointmentsMarkedCompleted: completedResult.count,
      oldOtpsDeleted: otpDeleted.count,
      expiredBkashPaymentsDeleted: bkashDeleted.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json(
      { success: false, error: "Cleanup failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
