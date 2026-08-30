/**
 * BulkSMS BD (bulksmsbd.net) Integration
 *
 * API Doc: GET or POST to http://bulksmsbd.net/api/smsapi
 *   Required params: api_key, type, number, senderid, message
 *
 * Cost: ~৳0.30-0.50 per SMS depending on volume
 *
 * Note: If you get error code 1031 "You have no access for SMS Sending",
 * check these in your BulkSMS BD account:
 *   1. SMS sending is enabled on your account
 *   2. Your API key has "Send SMS" permission
 *   3. Your Sender ID is registered and approved
 *   4. You have sufficient balance
 */

const BULKSMS_API_KEY = process.env.BULKSMS_API_KEY || "";
const BULKSMS_SENDER_ID = process.env.BULKSMS_SENDER_ID || "";
const BULKSMS_API_URL =
  process.env.BULKSMS_API_URL ||
  "http://bulksmsbd.net/api/smsapi";

interface SendSmsInput {
  to: string;
  message: string;
}

interface SendSmsResult {
  success: boolean;
  error?: string;
  messageId?: string;
  errorCode?: string;
}

// Mapping of BulkSMS BD error codes to user-friendly messages
// Based on official BulkSMS BD documentation
const ERROR_MESSAGES: Record<string, string> = {
  "202": "SMS submitted successfully",
  "1001": "Invalid phone number. Use format: 88017XXXXXXXX, 88018XXXXXXXX, 88019XXXXXXXX",
  "1002": "Sender ID not correct or disabled. Please check your registered sender ID in BulkSMS BD dashboard",
  "1003": "Required fields missing or contact your system administrator",
  "1005": "Internal error. Please try again later",
  "1006": "Balance validity not available. Please recharge your BulkSMS BD account",
  "1007": "Balance insufficient. Please recharge your BulkSMS BD account",
  "1011": "User ID not found. Please verify your API key",
  "1012": "Masking SMS must be sent in Bengali",
  "1013": "Sender ID has not found gateway by API key. Contact support@bulksmsbd.net",
  "1014": "Sender type name not found using this sender by API key",
  "1015": "Sender ID has not found any valid gateway by API key",
  "1016": "Sender type name active price info not found by this sender ID",
  "1017": "Sender type name price info not found by this sender ID",
  "1018": "The owner of this (username) account is disabled. Contact BulkSMS BD admin",
  "1019": "The (sender type name) price of this (username) account is disabled",
  "1020": "The parent of this account is not found",
  "1021": "The parent active (sender type name) price of this account is not found",
  "1031": "Your account is not verified. Please contact BulkSMS BD administrator to verify your account at support@bulksmsbd.net",
  "1032": "Your IP is not whitelisted. Add your server IP to BulkSMS BD whitelist",
};

function formatPhone(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/[^0-9]/g, "");
  // Bangladesh format: 01XXXXXXXXX -> 8801XXXXXXXXX
  if (cleaned.startsWith("0")) {
    cleaned = "880" + cleaned.substring(1);
  } else if (!cleaned.startsWith("880") && cleaned.length === 11) {
    cleaned = "880" + cleaned;
  }
  return cleaned;
}

export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  if (!BULKSMS_API_KEY) {
    return { success: false, error: "BulkSMS API key not configured" };
  }
  if (!BULKSMS_SENDER_ID) {
    return { success: false, error: "BulkSMS Sender ID not configured" };
  }

  const phone = formatPhone(input.to);
  if (phone.length < 13) {
    return { success: false, error: "Invalid phone number (use 01XXXXXXXXX format)" };
  }

  try {
    // Build URL - the pre-configured URL has all params with placeholder "Receiver" and "TestSMS"
    // We need to replace the placeholders with our actual values
    let url: string;
    if (BULKSMS_API_URL.includes("number=Receiver")) {
      // Replace the placeholder Receiver with the actual phone, and TestSMS with our message
      url = BULKSMS_API_URL
        .replace("number=Receiver", `number=${phone}`)
        .replace("message=TestSMS", `message=${encodeURIComponent(input.message)}`);
    } else {
      // Build URL from scratch
      const params = new URLSearchParams({
        api_key: BULKSMS_API_KEY,
        type: "text",
        number: phone,
        senderid: BULKSMS_SENDER_ID,
        message: input.message,
      });
      url = `${BULKSMS_API_URL}?${params.toString()}`;
    }

    const response = await fetch(url, { method: "GET" });
    const text = await response.text();
    const trimmed = text.trim();

    // Try parsing as JSON first
    try {
      const json = JSON.parse(trimmed);
      if (json.response_code !== undefined) {
        const code = String(json.response_code);
        // Success codes from BulkSMS BD
        if (code === "202" || code === "200" || code === "1000" || code === "1101" || code === "1102") {
          return { success: true, messageId: code };
        }
        // Error response
        return {
          success: false,
          errorCode: code,
          error: ERROR_MESSAGES[code] || json.error_message || `BulkSMS error code: ${code}`,
        };
      }
    } catch {
      // Not JSON, treat as plain text code
    }

    // Plain text response (older API)
    if (trimmed === "202" || trimmed === "1000" || trimmed === "1101" || trimmed === "1102" || trimmed === "OK") {
      return { success: true, messageId: trimmed };
    }

    return {
      success: false,
      errorCode: trimmed,
      error: ERROR_MESSAGES[trimmed] || `BulkSMS error code: ${trimmed || "Unknown"}`,
    };
  } catch (error) {
    console.error("BulkSMS send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================================
// High-level SMS templates for booking system
// =====================================================================

export async function sendBookingSms(data: {
  to: string;
  patientName: string;
  doctorName: string;
  serialNumber: number;
  slotDate: Date;
  startTime: Date;
}): Promise<SendSmsResult> {
  const dateStr = data.slotDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = data.startTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const message = `Dr Chamber: Hi ${data.patientName}, your serial #${data.serialNumber} with ${data.doctorName} is confirmed for ${dateStr} at ${timeStr}. Show this SMS at the chamber. -DRCHAMBER`;

  return sendSms({ to: data.to, message });
}

export async function sendQueueAdvanceSms(data: {
  to: string;
  patientName: string;
  doctorName: string;
  serialNumber: number;
}): Promise<SendSmsResult> {
  const message = `Dr Chamber: ${data.patientName}, you are NEXT (Serial #${data.serialNumber}) with ${data.doctorName}. Please be ready at the chamber now. -DRCHAMBER`;
  return sendSms({ to: data.to, message });
}

export async function sendCancellationSms(data: {
  to: string;
  patientName: string;
  doctorName: string;
  serialNumber: number;
}): Promise<SendSmsResult> {
  const message = `Dr Chamber: ${data.patientName}, your appointment (Serial #${data.serialNumber}) with ${data.doctorName} has been cancelled. Book again at drchamber.info -DRCHAMBER`;
  return sendSms({ to: data.to, message });
}

