import crypto from "crypto";

interface VerificationRecord {
  identifier: string; // email or phone
  otp: string;
  token: string;
  method: "EMAIL" | "WHATSAPP";
  expiresAt: number; // timestamp
  attempts: number;
  userId: number;
  userName: string;
}

// In-memory persistent record map on globalThis to survive HMR in dev
const globalRecoveryStore = globalThis as unknown as {
  _recoveryStore?: Map<string, VerificationRecord>;
};

if (!globalRecoveryStore._recoveryStore) {
  globalRecoveryStore._recoveryStore = new Map<string, VerificationRecord>();
}

const store = globalRecoveryStore._recoveryStore;

export function generateVerificationOTP(
  user: { id: number; name: string; email: string; phone: string | null },
  method: "EMAIL" | "WHATSAPP"
): { otp: string; token: string; expiresMinutes: number; whatsappUrl?: string } {
  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(24).toString("hex");
  const expiresMinutes = 15;
  const expiresAt = Date.now() + expiresMinutes * 60 * 1000;

  const record: VerificationRecord = {
    identifier: (method === "EMAIL" ? user.email : user.phone || user.email).toLowerCase().trim(),
    otp,
    token,
    method,
    expiresAt,
    attempts: 0,
    userId: user.id,
    userName: user.name,
  };

  // Store indexed by identifier and token
  store.set(record.identifier, record);
  store.set(token, record);

  let whatsappUrl: string | undefined;
  if (method === "WHATSAPP" && user.phone) {
    const cleanPhone = user.phone.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Hello ${user.name},\nYour Doctor Directory password reset verification code is: *${otp}*\nThis code expires in 15 minutes. If you did not request this, please ignore this message.`
    );
    whatsappUrl = `https://wa.me/${cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`}?text=${msg}`;
  }

  return { otp, token, expiresMinutes, whatsappUrl };
}

export function verifyOTP(
  identifierOrToken: string,
  enteredOtp?: string
): { valid: boolean; message: string; userId?: number; userEmail?: string } {
  const key = identifierOrToken.toLowerCase().trim();
  const record = store.get(key);

  if (!record) {
    return {
      valid: false,
      message: "No active verification request found or it has expired. Please request a new code.",
    };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(key);
    store.delete(record.token);
    store.delete(record.identifier);
    return {
      valid: false,
      message: "Verification code has expired. Please request a new code.",
    };
  }

  if (record.attempts >= 5) {
    store.delete(key);
    return {
      valid: false,
      message: "Too many incorrect attempts. Please request a new verification code.",
    };
  }

  if (enteredOtp) {
    record.attempts += 1;
    if (record.otp !== enteredOtp.trim()) {
      return {
        valid: false,
        message: "Incorrect verification code. Please check and try again.",
      };
    }
  }

  return {
    valid: true,
    message: "Verified successfully.",
    userId: record.userId,
    userEmail: record.identifier,
  };
}

export function clearVerification(identifierOrToken: string) {
  const key = identifierOrToken.toLowerCase().trim();
  const record = store.get(key);
  if (record) {
    store.delete(record.identifier);
    store.delete(record.token);
  }
  store.delete(key);
}
