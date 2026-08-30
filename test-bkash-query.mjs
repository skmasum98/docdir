import "dotenv/config";

const BKASH_BASE_URL = process.env.BKASH_BASE_URL;
const BKASH_APP_KEY = process.env.BKASH_APP_KEY;
const BKASH_USERNAME = process.env.BKASH_USERNAME;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET;

async function getToken() {
  const r = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username: BKASH_USERNAME,
      password: BKASH_PASSWORD,
    },
    body: JSON.stringify({
      app_key: BKASH_APP_KEY,
      app_secret: BKASH_APP_SECRET,
    }),
  });
  const data = await r.json();
  return data.id_token;
}

async function test() {
  const idToken = await getToken();
  console.log("Token acquired");

  // First create a payment
  const createRes = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Authorization": idToken,
      "X-APP-Key": BKASH_APP_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      mode: "0011",
      payerReference: "test",
      callbackURL: "https://medlipi.onrender.com/api/subscription/callback",
      amount: "60",
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: `TEST-${Date.now()}`,
    }),
  });
  const createData = await createRes.json();
  const paymentID = createData.paymentID;
  console.log("Created payment:", paymentID);

  // Now try various query endpoints
  console.log("\n=== Try various query endpoints ===");

  const endpoints = [
    `${BKASH_BASE_URL}/tokenized/checkout/payment/query/${paymentID}`,
    `${BKASH_BASE_URL}/tokenized/checkout/query/${paymentID}`,
    `${BKASH_BASE_URL}/tokenized/checkout/payment/status/${paymentID}`,
  ];

  for (const url of endpoints) {
    try {
      const r = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": idToken,
          "X-APP-Key": BKASH_APP_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const t = await r.text();
      console.log(`\n${url}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Response: ${t.substring(0, 200)}`);
    } catch (e) {
      console.log(`\n${url}`);
      console.log(`  Error: ${e.message}`);
    }
  }
}

test().catch(console.error);
