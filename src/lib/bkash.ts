
/**
 * bKash Tokenized Checkout v1.2.0-beta
 *
 * Endpoints:
 *   POST /tokenized/checkout/token/grant
 *   POST /tokenized/checkout/create
 *   POST /tokenized/checkout/execute
 *   POST /tokenized/checkout/payment/status
 *
 * IMPORTANT:
 * - This file must run on the server only.
 * - Never expose BKASH_APP_SECRET, BKASH_USERNAME or BKASH_PASSWORD
 *   to the browser.
 * - No AWS SigV4 is required for these Tokenized Checkout operations.
 */

const BKASH_USERNAME = process.env.BKASH_USERNAME || "";
const BKASH_PASSWORD = process.env.BKASH_PASSWORD || "";
const BKASH_APP_KEY = process.env.BKASH_APP_KEY || "";
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET || "";

const BKASH_BASE_URL =
  process.env.BKASH_BASE_URL ||
  "https://tokenized.pay.bka.sh/v1.2.0-beta";

const BKASH_CALLBACK_URL = process.env.BKASH_CALLBACK_URL || "";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface BkashTokenResponse {
  statusCode?: string;
  statusMessage?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: string;
  refresh_token?: string;
}

interface BkashCreatePaymentResponse {
  statusCode?: string;
  statusMessage?: string;
  paymentID?: string;
  bkashURL?: string;
  callbackURL?: string;
  successCallbackURL?: string;
  failureCallbackURL?: string;
  cancelledCallbackURL?: string;
  amount?: string;
  intent?: string;
  currency?: string;
  paymentCreateTime?: string;
  transactionStatus?: string;
  merchantInvoiceNumber?: string;
}

interface BkashExecutePaymentResponse {
  statusCode?: string;
  statusMessage?: string;
  paymentID?: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  intent?: string;
  merchantInvoiceNumber?: string;
  paymentExecuteTime?: string;
}

interface BkashPaymentStatusResponse {
  statusCode?: string;
  statusMessage?: string;
  paymentID?: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  intent?: string;
  merchantInvoiceNumber?: string;
  paymentCreateTime?: string;
  paymentExecuteTime?: string;
}

// -----------------------------------------------------------------------------
// Token cache
// -----------------------------------------------------------------------------

let cachedToken: {
  token: string;
  expiresAt: number;
} | null = null;

// Refresh token 2 minutes before expiry.
const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000;

// -----------------------------------------------------------------------------
// Configuration validation
// -----------------------------------------------------------------------------

function validateConfig() {
  const missing: string[] = [];

  if (!BKASH_USERNAME) missing.push("BKASH_USERNAME");
  if (!BKASH_PASSWORD) missing.push("BKASH_PASSWORD");
  if (!BKASH_APP_KEY) missing.push("BKASH_APP_KEY");
  if (!BKASH_APP_SECRET) missing.push("BKASH_APP_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `Missing bKash environment variables: ${missing.join(", ")}`
    );
  }

  if (!BKASH_BASE_URL) {
    throw new Error("BKASH_BASE_URL is not configured");
  }
}

// -----------------------------------------------------------------------------
// Generic JSON request helper
// -----------------------------------------------------------------------------

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error(
      `bKash returned an empty response (HTTP ${response.status})`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `bKash returned invalid JSON (HTTP ${response.status}): ${text.slice(
        0,
        300
      )}`
    );
  }
}

// -----------------------------------------------------------------------------
// Token Grant
// -----------------------------------------------------------------------------

async function requestNewToken(): Promise<string> {
  validateConfig();

  const url = `${BKASH_BASE_URL}/tokenized/checkout/token/grant`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",

      // bKash token grant authentication
      username: BKASH_USERNAME,
      password: BKASH_PASSWORD,
    },
    body: JSON.stringify({
      app_key: BKASH_APP_KEY,
      app_secret: BKASH_APP_SECRET,
    }),

    // Don't allow an old cached HTTP response.
    cache: "no-store",
  });

  const data = await parseJsonResponse<BkashTokenResponse>(response);

  if (
    data.statusCode !== "0000" ||
    !data.id_token
  ) {
    console.error("bKash token grant failed:", {
      httpStatus: response.status,
      statusCode: data.statusCode,
      statusMessage: data.statusMessage,
    });

    throw new Error(
      data.statusMessage || "Failed to obtain bKash authorization token"
    );
  }

  const expiresInSeconds = Number(data.expires_in || "3600");

  const expiresInMs =
    Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
      ? expiresInSeconds * 1000
      : 3600 * 1000;

  cachedToken = {
    token: data.id_token,
    expiresAt: Date.now() + expiresInMs,
  };

  return data.id_token;
}

// -----------------------------------------------------------------------------
// Get cached token
// -----------------------------------------------------------------------------

async function getAccessToken(forceRefresh = false): Promise<string> {
  if (
    !forceRefresh &&
    cachedToken &&
    cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS
  ) {
    return cachedToken.token;
  }

  return requestNewToken();
}

// -----------------------------------------------------------------------------
// bKash API headers
// -----------------------------------------------------------------------------

async function getBkashHeaders(forceRefresh = false) {
  const token = await getAccessToken(forceRefresh);

  return {
    Authorization: token,
    "X-APP-Key": BKASH_APP_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// -----------------------------------------------------------------------------
// Execute a request once.
// If token is rejected, refresh token and retry once.
// -----------------------------------------------------------------------------

async function bkashRequest<T>(
  path: string,
  options: {
    method: "POST";
    body?: unknown;
  },
  retry = true
): Promise<T> {
  const headers = await getBkashHeaders(false);

  const response = await fetch(`${BKASH_BASE_URL}${path}`, {
    method: options.method,
    headers,
    body:
      options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
    cache: "no-store",
  });

  const data = await parseJsonResponse<T>(response);

  /*
   * Some bKash environments can reject an expired/invalid token.
   * Clear the cached token and retry once.
   */
  const statusCode = (data as { statusCode?: string }).statusCode;

  if (
    retry &&
    statusCode &&
    ["2001", "2002", "2003", "2004"].includes(statusCode)
  ) {
    cachedToken = null;

    const retryHeaders = await getBkashHeaders(true);

    const retryResponse = await fetch(`${BKASH_BASE_URL}${path}`, {
      method: options.method,
      headers: retryHeaders,
      body:
        options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      cache: "no-store",
    });

    return parseJsonResponse<T>(retryResponse);
  }

  return data;
}

// -----------------------------------------------------------------------------
// Public: Grant Token
// -----------------------------------------------------------------------------

export async function grantToken(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    cachedToken = null;

    const token = await requestNewToken();

    return {
      success: true,
      token,
    };
  } catch (error) {
    console.error("bKash grant token error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to obtain bKash token",
    };
  }
}

// -----------------------------------------------------------------------------
// Public: Create Payment
// -----------------------------------------------------------------------------

export async function createPayment(input: {
  amount: number;
  invoiceNumber: string;
  payerReference?: string;
  intent?: "sale" | "authorization";
}): Promise<{
  success: boolean;
  paymentID?: string;
  bkashURL?: string;
  error?: string;
}> {
  try {
    validateConfig();

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return {
        success: false,
        error: "Invalid payment amount",
      };
    }

    if (!input.invoiceNumber?.trim()) {
      return {
        success: false,
        error: "Invoice number is required",
      };
    }

    if (!BKASH_CALLBACK_URL) {
      return {
        success: false,
        error: "BKASH_CALLBACK_URL is not configured",
      };
    }

    // bKash accepts amount as a string.
    const amount = input.amount.toFixed(2);

    const data = await bkashRequest<BkashCreatePaymentResponse>(
      "/tokenized/checkout/create",
      {
        method: "POST",
        body: {
          mode: "0011",

          // bKash accepts payerReference.
          // Keep a non-empty value to avoid sending undefined.
          payerReference: input.payerReference || "customer",

          callbackURL: BKASH_CALLBACK_URL,

          amount,

          currency: "BDT",

          intent: input.intent || "sale",

          merchantInvoiceNumber: input.invoiceNumber.trim(),
        },
      }
    );

    if (data.statusCode !== "0000" || !data.paymentID) {
      console.error("bKash create payment failed:", {
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
        paymentID: data.paymentID,
      });

      return {
        success: false,
        error:
          data.statusMessage || "Failed to create bKash payment",
      };
    }

    if (!data.bkashURL) {
      console.error(
        "bKash create payment succeeded but bkashURL is missing:",
        data
      );

      return {
        success: false,
        error: "bKash payment URL was not returned",
      };
    }

    return {
      success: true,
      paymentID: data.paymentID,
      bkashURL: data.bkashURL,
    };
  } catch (error) {
    console.error("bKash create payment error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create bKash payment",
    };
  }
}

// -----------------------------------------------------------------------------
// Public: Execute Payment
// -----------------------------------------------------------------------------

export async function executePayment(paymentID: string): Promise<{
  success: boolean;
  paymentID?: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: number;
  error?: string;
}> {
  try {
    if (!paymentID?.trim()) {
      return {
        success: false,
        error: "Payment ID is required",
      };
    }

    const data = await bkashRequest<BkashExecutePaymentResponse>(
      "/tokenized/checkout/execute",
      {
        method: "POST",
        body: {
          paymentID: paymentID.trim(),
        },
      }
    );

    if (data.statusCode !== "0000") {
      console.error("bKash execute payment failed:", {
        paymentID,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
      });

      return {
        success: false,
        error:
          data.statusMessage || "Failed to execute bKash payment",
        transactionStatus: data.transactionStatus,
      };
    }

    if (data.transactionStatus !== "Completed") {
      return {
        success: false,
        paymentID: data.paymentID,
        transactionStatus: data.transactionStatus,
        error: `Payment status: ${
          data.transactionStatus || "Unknown"
        }`,
      };
    }

    return {
      success: true,
      paymentID: data.paymentID,
      trxID: data.trxID,
      transactionStatus: data.transactionStatus,
      amount: data.amount ? Number(data.amount) : undefined,
    };
  } catch (error) {
    console.error("bKash execute payment error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to execute bKash payment",
    };
  }
}

// -----------------------------------------------------------------------------
// Public: Query Payment Status
// -----------------------------------------------------------------------------
//
// IMPORTANT:
// bKash Tokenized Checkout uses:
//
// POST /tokenized/checkout/payment/status
//
// Body:
// {
//   paymentID: "...."
// }
//
// Do NOT use AWS SigV4 here.
// Do NOT use:
// GET /tokenized/checkout/payment/status/{paymentID}
//

export async function queryPayment(paymentID: string): Promise<{
  success: boolean;
  paymentID?: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: number;
  currency?: string;
  merchantInvoiceNumber?: string;
  error?: string;
}> {
  try {
    if (!paymentID?.trim()) {
      return {
        success: false,
        error: "Payment ID is required",
      };
    }

    const data =
      await bkashRequest<BkashPaymentStatusResponse>(
        "/tokenized/checkout/payment/status",
        {
          method: "POST",
          body: {
            paymentID: paymentID.trim(),
          },
        }
      );

    if (data.statusCode !== "0000") {
      console.error("bKash payment status query failed:", {
        paymentID,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
      });

      return {
        success: false,
        paymentID: data.paymentID,
        transactionStatus: data.transactionStatus,
        error:
          data.statusMessage || "Failed to query bKash payment",
      };
    }

    return {
      success: true,
      paymentID: data.paymentID,
      trxID: data.trxID,
      transactionStatus: data.transactionStatus,
      amount: data.amount ? Number(data.amount) : undefined,
      currency: data.currency,
      merchantInvoiceNumber: data.merchantInvoiceNumber,
    };
  } catch (error) {
    console.error("bKash query payment error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to query bKash payment",
    };
  }
}

// -----------------------------------------------------------------------------
// Optional helper: Clear cached token
// -----------------------------------------------------------------------------

export function clearBkashTokenCache() {
  cachedToken = null;
}
