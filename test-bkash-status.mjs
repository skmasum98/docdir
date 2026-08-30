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
  const paymentID = "TR0011m8ZPuuC1788065693628";

  // Try the status endpoint with simple auth
  console.log("=== Try /payment/status with simple auth ===");
  const r1 = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/payment/status/${paymentID}`, {
    method: "GET",
    headers: {
      "Authorization": idToken,
      "X-APP-Key": BKASH_APP_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  console.log("Status:", r1.status);
  console.log("Response:", (await r1.text()).substring(0, 300));

  // Try with lowercase x-app-key
  console.log("\n=== Try /payment/status with lowercase x-app-key ===");
  const r2 = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/payment/status/${paymentID}`, {
    method: "GET",
    headers: {
      "Authorization": idToken,
      "x-app-key": BKASH_APP_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  console.log("Status:", r2.status);
  console.log("Response:", (await r2.text()).substring(0, 300));
}

test().catch(console.error);
