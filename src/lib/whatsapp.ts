/**
 * WhatsApp Service for sending OTP via WhatsApp Business API
 *
 * Supports multiple providers:
 * - Meta WhatsApp Business Cloud API (official)
 * - Twilio WhatsApp API
 * - WhatsApp Business API via BSPs (e.g., 360dialog, MessageBird)
 *
 * Configuration via environment variables:
 * - WHATSAPP_PROVIDER: "meta" | "twilio" (default: "meta")
 * - WHATSAPP_API_TOKEN: API access token
 * - WHATSAPP_PHONE_NUMBER_ID: Phone number ID (Meta) or sender (Twilio)
 * - WHATSAPP_BUSINESS_ACCOUNT_ID: WhatsApp Business Account ID (Meta only)
 * - WHATSAPP_TEMPLATE_NAME: Approved template name (e.g., "password_reset_otp")
 * - WHATSAPP_TEMPLATE_LANGUAGE: Template language code (default: "en")
 */

interface WhatsAppConfig {
  provider: "meta" | "twilio";
  apiToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  templateName: string;
  templateLanguage: string;
}

function getWhatsAppConfig(): WhatsAppConfig {
  return {
    provider: (process.env.WHATSAPP_PROVIDER as "meta" | "twilio") || "meta",
    apiToken: process.env.WHATSAPP_API_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || "password_reset_otp",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
  };
}

export interface OtpWhatsAppData {
  to: string; // E.164 format, e.g. "8801700000000"
  userName: string;
  otp: string;
  expiresMinutes: number;
  purpose: "password_reset" | "phone_verification" | "two_factor";
}

export async function sendOtpWhatsApp(
  data: OtpWhatsAppData
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const config = getWhatsAppConfig();

  if (!config.apiToken || !config.phoneNumberId) {
    return {
      success: false,
      error: "WhatsApp service not configured. Please set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID environment variables.",
    };
  }

  try {
    if (config.provider === "meta") {
      return await sendViaMeta(data, config);
    } else if (config.provider === "twilio") {
      return await sendViaTwilio(data, config);
    }
    return { success: false, error: "Unknown WhatsApp provider" };
  } catch (error) {
    console.error("Failed to send WhatsApp OTP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function sendViaMeta(
  data: OtpWhatsAppData,
  config: WhatsAppConfig
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;

  // Using a pre-approved WhatsApp template message (required for business-initiated conversations)
  // Template must have variables for: {{1}} = name, {{2}} = otp, {{3}} = expires_minutes
  const payload = {
    messaging_product: "whatsapp",
    to: formatPhoneForWhatsApp(data.to),
    type: "template",
    template: {
      name: config.templateName,
      language: { code: config.templateLanguage },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: data.userName },
            { type: "text", text: data.otp },
            { type: "text", text: String(data.expiresMinutes) },
          ],
        },
      ],
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: result.error?.message || `WhatsApp API error: ${response.status}`,
    };
  }

  return { success: true, messageId: result.messages?.[0]?.id };
}

async function sendViaTwilio(
  data: OtpWhatsAppData,
  config: WhatsAppConfig
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  // Twilio WhatsApp API endpoint
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.phoneNumberId}/Messages.json`;

  const body = new URLSearchParams({
    From: `whatsapp:${config.phoneNumberId}`,
    To: `whatsapp:${formatPhoneForWhatsApp(data.to)}`,
    Body: `Hello ${data.userName},\n\nYour Doctor Directory verification code is: *${data.otp}*\n\nThis code expires in ${data.expiresMinutes} minutes.\n\nIf you did not request this, please ignore this message.\n\n- Doctor Directory Team`,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.phoneNumberId}:${config.apiToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: result.message || `Twilio API error: ${response.status}`,
    };
  }

  return { success: true, messageId: result.sid };
}

function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/[^0-9]/g, "");

  // If starts with 0 (Bangladesh local format), replace with country code
  if (cleaned.startsWith("0")) {
    cleaned = "880" + cleaned.substring(1);
  }

  // If doesn't have country code, add Bangladesh's +880
  if (!cleaned.startsWith("880") && cleaned.length === 11) {
    cleaned = "880" + cleaned;
  }

  return cleaned;
}

export function maskPhoneNumber(phone: string): string {
  if (!phone) return "";
  if (phone.length < 5) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}
