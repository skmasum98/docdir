/**
 * BulkSMS BD (bulksmsbd.net) Integration
 *
 * API Doc: GET or POST to http://bulksmsbd.net/api/smsapi
 *   Required params: api_key, type, number, senderid, message
 *
 * Cost: ~৳0.30-0.50 per SMS depending on volume
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
}

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
    return { success: false, error: "Invalid phone number" };
  }

  try {
    // Build URL - the pre-configured URL has all params with placeholder "Receiver" and "TestSMS"
    // We need to replace the placeholders with our actual values
    let url: string;
    if (BULKSMS_API_URL.includes("number=Receiver")) {
      // Replace the placeholder Receiver with the actual phone, and TestSMS with our message
      // The full URL has all params encoded in the URL
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

    // BulkSMS BD may return either a plain code string or a JSON object
    let success = false;
    let errorCode = trimmed;

    // Try parsing as JSON first
    try {
      const json = JSON.parse(trimmed);
      if (json.response_code) {
        errorCode = String(json.response_code);
        // Success codes: 1000, 1001, 1002, etc. (varies)
        success = /^1[0-9]{3}$/.test(errorCode) && !["1003", "1004", "1005", "1006", "1007", "1008", "1009", "1010", "1011", "1012", "1013", "1014", "1031"].includes(errorCode);
        if (!success) {
          return {
            success: false,
            error: json.error_message || `BulkSMS error code: ${errorCode}`,
          };
        }
        return { success: true, messageId: errorCode };
      }
    } catch {
      // Not JSON, treat as plain text code
    }

    // Success codes for plain text response
    const successCodes = ["1101", "1102", "1000", "100"];

    if (successCodes.includes(trimmed) || /^1[0-9]{3}$/.test(trimmed)) {
      return { success: true, messageId: trimmed };
    } else {
      console.error("BulkSMS error response:", text);
      return {
        success: false,
        error: `BulkSMS error code: ${trimmed || "Unknown"}`,
      };
    }
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
