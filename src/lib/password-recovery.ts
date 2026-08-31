import crypto from "crypto";

interface VerificationRecord {
  identifier: string;
  otp: string;
  token: string;
  method: "EMAIL";
  expiresAt: number;
  attempts: number;
  userId: number;
  userName: string;
}

// In-memory store persisted on globalThis to survive HMR in development.
const globalRecoveryStore = globalThis as unknown as {
  _recoveryStore?: Map<string, VerificationRecord>;
};

if (!globalRecoveryStore._recoveryStore) {
  globalRecoveryStore._recoveryStore = new Map<string, VerificationRecord>();
}

const store = globalRecoveryStore._recoveryStore;

/**
 * Generate a secure 6-digit OTP for email password recovery.
 *
 * crypto.randomInt() is used instead of Math.random()
 * because Math.random() is not suitable for security-sensitive
 * values such as password reset OTPs.
 */
export function generateVerificationOTP(user: {
  id: number;
  name: string;
  email: string;
}): {
  otp: string;
  token: string;
  expiresMinutes: number;
} {
  const identifier = user.email.toLowerCase().trim();

  // Cryptographically secure 6-digit OTP.
  const otp = crypto.randomInt(100000, 1000000).toString();

  // Cryptographically secure recovery token.
  const token = crypto.randomBytes(32).toString("hex");

  const expiresMinutes = 15;
  const expiresAt = Date.now() + expiresMinutes * 60 * 1000;

  const record: VerificationRecord = {
    identifier,
    otp,
    token,
    method: "EMAIL",
    expiresAt,
    attempts: 0,
    userId: user.id,
    userName: user.name,
  };

  // Remove any previous recovery request for this email.
  const existingRecord = store.get(identifier);

  if (existingRecord) {
    store.delete(existingRecord.identifier);
    store.delete(existingRecord.token);
  }

  // Store by both email and token.
  store.set(identifier, record);
  store.set(token, record);

  return {
    otp,
    token,
    expiresMinutes,
  };
}

/**
 * Verify an OTP using either the user's email or recovery token.
 */
export function verifyOTP(
  identifierOrToken: string,
  enteredOtp?: string
): {
  valid: boolean;
  message: string;
  userId?: number;
  userEmail?: string;
} {
  const key = identifierOrToken.toLowerCase().trim();
  const record = store.get(key);

  if (!record) {
    return {
      valid: false,
      message:
        "No active verification request found or it has expired. Please request a new code.",
    };
  }

  // Check expiration.
  if (Date.now() > record.expiresAt) {
    store.delete(record.identifier);
    store.delete(record.token);

    return {
      valid: false,
      message:
        "Verification code has expired. Please request a new code.",
    };
  }

  // Maximum 5 OTP attempts.
  if (record.attempts >= 5) {
    store.delete(record.identifier);
    store.delete(record.token);

    return {
      valid: false,
      message:
        "Too many incorrect attempts. Please request a new verification code.",
    };
  }

  // If no OTP is supplied, only confirm that an active record exists.
  if (!enteredOtp) {
    return {
      valid: true,
      message: "Verification request is active.",
      userId: record.userId,
      userEmail: record.identifier,
    };
  }

  const normalizedOtp = enteredOtp.trim();

  // Count every verification attempt.
  record.attempts += 1;

  // Constant-time comparison avoids directly comparing secrets.
  const expectedOtp = Buffer.from(record.otp);
  const providedOtp = Buffer.from(normalizedOtp);

  const otpMatches =
    expectedOtp.length === providedOtp.length &&
    crypto.timingSafeEqual(expectedOtp, providedOtp);

  if (!otpMatches) {
    if (record.attempts >= 5) {
      store.delete(record.identifier);
      store.delete(record.token);

      return {
        valid: false,
        message:
          "Too many incorrect attempts. Please request a new verification code.",
      };
    }

    return {
      valid: false,
      message:
        "Incorrect verification code. Please check and try again.",
    };
  }

  return {
    valid: true,
    message: "Verified successfully.",
    userId: record.userId,
    userEmail: record.identifier,
  };
}

/**
 * Clear a password recovery verification record.
 */
export function clearVerification(identifierOrToken: string): void {
  const key = identifierOrToken.toLowerCase().trim();
  const record = store.get(key);

  if (record) {
    store.delete(record.identifier);
    store.delete(record.token);
    return;
  }

  store.delete(key);
}
