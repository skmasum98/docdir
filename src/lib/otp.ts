import crypto from "crypto";
import { prisma } from "./prisma";
import type { OtpMethod, OtpPurpose } from "@prisma/client";

interface GenerateOtpOptions {
  userId: number;
  identifier: string;
  method: OtpMethod;
  purpose?: OtpPurpose;
  expiresInMinutes?: number;
  ipAddress?: string;
  userAgent?: string;
}

interface GenerateOtpResult {
  success: boolean;
  otp?: string;
  expiresAt?: Date;
  error?: string;
  retryAfter?: number; // seconds until can request again
}

const OTP_LENGTH = 6;
const DEFAULT_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60; // Can only request a new code every 60 seconds
const MAX_OTPS_PER_HOUR = 5; // Rate limit per identifier

/**
 * Generate a cryptographically secure random OTP
 */
function generateOtpCode(length: number = OTP_LENGTH): string {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  // Use crypto for better randomness in production
  const range = max - min;
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0) / 0xffffffff;
  return Math.floor(min + randomNumber * range).toString();
}

/**
 * Hash an OTP for secure storage
 */
function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Generate and store a new OTP
 */
export async function generateAndStoreOtp(options: GenerateOtpOptions): Promise<GenerateOtpResult> {
  const {
    userId,
    identifier,
    method,
    purpose = "PASSWORD_RESET",
    expiresInMinutes = DEFAULT_EXPIRY_MINUTES,
    ipAddress,
    userAgent,
  } = options;

  const normalizedIdentifier = identifier.toLowerCase().trim();

  try {
    // Check rate limit: max OTPs per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await prisma.otpCode.count({
      where: {
        identifier: normalizedIdentifier,
        purpose,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentOtps >= MAX_OTPS_PER_HOUR) {
      return {
        success: false,
        error: `Too many OTP requests. Please try again in an hour.`,
      };
    }

    // Check cooldown: must wait RESEND_COOLDOWN_SECONDS since last request
    const lastOtp = await prisma.otpCode.findFirst({
      where: {
        identifier: normalizedIdentifier,
        purpose,
        consumed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (lastOtp) {
      const secondsSinceLast = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
        return {
          success: false,
          error: `Please wait ${retryAfter} seconds before requesting a new code.`,
          retryAfter,
        };
      }
    }

    // Invalidate any existing unused OTPs for this identifier+purpose
    await prisma.otpCode.updateMany({
      where: {
        identifier: normalizedIdentifier,
        purpose,
        consumed: false,
      },
      data: { consumed: true },
    });

    // Generate new OTP
    const otp = generateOtpCode();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Store in database
    await prisma.otpCode.create({
      data: {
        userId,
        identifier: normalizedIdentifier,
        otpHash,
        method,
        purpose,
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    return {
      success: true,
      otp, // Only returned for sending via email/WhatsApp, never returned to client
      expiresAt,
    };
  } catch (error) {
    console.error("Failed to generate OTP:", error);
    return {
      success: false,
      error: "Failed to generate verification code. Please try again.",
    };
  }
}

interface VerifyOtpOptions {
  identifier: string;
  otp: string;
  purpose?: OtpPurpose;
}

interface VerifyOtpResult {
  success: boolean;
  valid: boolean;
  message: string;
  userId?: number;
  attemptsLeft?: number;
  expired?: boolean;
}

/**
 * Verify an OTP entered by the user
 */
export async function verifyOtpCode(options: VerifyOtpOptions): Promise<VerifyOtpResult> {
  const { identifier, otp, purpose = "PASSWORD_RESET" } = options;
  const normalizedIdentifier = identifier.toLowerCase().trim();
  const normalizedOtp = otp.trim();

  try {
    // Find the most recent unused OTP for this identifier
    const record = await prisma.otpCode.findFirst({
      where: {
        identifier: normalizedIdentifier,
        purpose,
        consumed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return {
        success: true,
        valid: false,
        message: "No active verification code found. Please request a new code.",
      };
    }

    // Check if expired
    if (new Date() > record.expiresAt) {
      // Mark as consumed
      await prisma.otpCode.update({
        where: { id: record.id },
        data: { consumed: true },
      });
      return {
        success: true,
        valid: false,
        expired: true,
        message: "Verification code has expired. Please request a new code.",
      };
    }

    // Check max attempts
    if (record.attempts >= record.maxAttempts) {
      await prisma.otpCode.update({
        where: { id: record.id },
        data: { consumed: true },
      });
      return {
        success: true,
        valid: false,
        message: "Too many incorrect attempts. Please request a new code.",
      };
    }

    // Increment attempts
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    // Verify OTP
    const otpHash = hashOtp(normalizedOtp);
    if (otpHash !== record.otpHash) {
      const attemptsLeft = record.maxAttempts - record.attempts - 1;
      return {
        success: true,
        valid: false,
        attemptsLeft,
        message:
          attemptsLeft > 0
            ? `Incorrect verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`
            : "Incorrect verification code. Please request a new one.",
      };
    }

    // Mark as consumed
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { consumed: true },
    });

    return {
      success: true,
      valid: true,
      message: "Verification successful.",
      userId: record.userId,
    };
  } catch (error) {
    console.error("Failed to verify OTP:", error);
    return {
      success: false,
      valid: false,
      message: "Verification failed. Please try again.",
    };
  }
}

/**
 * Invalidate all OTPs for a user (e.g., after password change)
 */
export async function invalidateUserOtps(userId: number, purpose?: OtpPurpose): Promise<void> {
  await prisma.otpCode.updateMany({
    where: {
      userId,
      consumed: false,
      ...(purpose ? { purpose } : {}),
    },
    data: { consumed: true },
  });
}

/**
 * Clean up expired OTPs (call this periodically via cron)
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const result = await prisma.otpCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { consumed: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
  });
  return result.count;
}
