import { NextRequest, NextResponse } from "next/server";
import { executePayment, queryPayment } from "@/lib/bkash";
import { prisma } from "@/lib/prisma";

/**
 * bKash payment callback.
 * After customer completes payment on bKash, they are redirected here.
 * URL params from bKash: ?paymentID=...&status=success/failure/cancelled
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentID = searchParams.get("paymentID");
  const status = searchParams.get("status");

  const baseUrl = process.env.NEXTAUTH_URL || "https://drchamber.info";

  if (!paymentID) {
    return NextResponse.redirect(`${baseUrl}/dashboard/sms?bkash=invalid`);
  }

  if (status === "failure" || status === "cancelled") {
    // Mark payment as cancelled/failed
    await prisma.pendingBkashPayment.updateMany({
      where: { paymentId: paymentID, status: "PENDING" },
      data: { status: "CANCELLED", completedAt: new Date() },
    });
    return NextResponse.redirect(
      `${baseUrl}/dashboard/sms?bkash=cancelled`
    );
  }

  // Execute the payment (capture the funds)
  let result = await executePayment(paymentID);

  // If execute failed, try to query (payment might already be executed)
  if (!result.success) {
    const query = await queryPayment(paymentID);
    if (query.success && query.transactionStatus === "Completed" && query.trxID) {
      result = {
        success: true,
        trxID: query.trxID,
        transactionStatus: query.transactionStatus,
      };
    }
  }

  if (!result.success || !result.trxID) {
    await prisma.pendingBkashPayment.updateMany({
      where: { paymentId: paymentID, status: "PENDING" },
      data: { status: "FAILED", completedAt: new Date() },
    });
    return NextResponse.redirect(
      `${baseUrl}/dashboard/sms?bkash=failed&error=${encodeURIComponent(result.error || "unknown")}`
    );
  }

  // Find the pending payment and complete it
  const pending = await prisma.pendingBkashPayment.findUnique({
    where: { paymentId: paymentID },
  });

  if (!pending) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/sms?bkash=notfound`
    );
  }

  // Check if already completed (idempotency)
  if (pending.status === "COMPLETED") {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/sms?bkash=success&trxID=${result.trxID}`
    );
  }

  // Add credits to user's balance
  const balance = await prisma.smsBalance.findUnique({
    where: { userId: pending.userId },
  });

  if (balance) {
    await prisma.$transaction([
      prisma.smsBalance.update({
        where: { id: balance.id },
        data: {
          totalCredits: { increment: pending.credits },
          lastTopupAt: new Date(),
          smsEnabled: true, // Auto-enable on top-up
        },
      }),
      prisma.smsTransaction.create({
        data: {
          userId: pending.userId,
          balanceId: balance.id,
          type: "TOPUP",
          amount: pending.costBdt,
          credits: pending.credits,
          costBdt: pending.costBdt,
          bkashTrxId: result.trxID,
          bkashPaymentId: paymentID,
          status: "COMPLETED",
          description: `bKash top-up: ${pending.credits} credits for ৳${pending.costBdt}`,
          completedAt: new Date(),
        },
      }),
      prisma.pendingBkashPayment.update({
        where: { id: pending.id },
        data: {
          status: "COMPLETED",
          trxId: result.trxID,
          completedAt: new Date(),
        },
      }),
    ]);
  }

  return NextResponse.redirect(
    `${baseUrl}/dashboard/sms?bkash=success&trxID=${result.trxID}&credits=${pending.credits}`
  );
}
