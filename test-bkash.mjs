import "dotenv/config";
import { grantToken, createPayment, executePayment, queryPayment } from "./src/lib/bkash";

async function testBkash() {
  console.log("=== bKash Integration Test ===\n");

  // Test 1: Grant Token
  console.log("Test 1: Granting token...");
  const tokenResult = await grantToken();
  console.log("Result:", tokenResult.success ? "✅ Success" : `❌ Failed: ${tokenResult.error}`);
  if (!tokenResult.success) return;

  // Test 2: Create Payment
  console.log("\nTest 2: Creating payment (৳60)...");
  const invoiceNumber = `TEST-${Date.now()}`;
  const paymentResult = await createPayment({
    amount: 60,
    invoiceNumber,
    payerReference: "test-user-1",
  });
  console.log("Result:", paymentResult.success ? "✅ Success" : `❌ Failed: ${paymentResult.error}`);
  if (!paymentResult.success) return;

  console.log("Payment ID:", paymentResult.paymentID);
  console.log("bKash URL:", paymentResult.bkashURL);

  // Test 3: Query Payment
  console.log("\nTest 3: Querying payment status...");
  const queryResult = await queryPayment(paymentResult.paymentID);
  console.log("Result:", queryResult.success ? "✅ Success" : `❌ Failed: ${queryResult.error}`);
  if (queryResult.success) {
    console.log("Status:", queryResult.transactionStatus);
  }
}

testBkash().catch(console.error);
