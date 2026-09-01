/**
 * SMS pricing tiers for top-up.
 * This is a plain constant (NOT a server action) so it can be imported into client components.
 */

export const SMS_PRICING_TIERS = [
  { credits: 10, priceBdt: 6, label: "10 SMS - ৳6" },
  { credits: 250, priceBdt: 140, label: "250 SMS - ৳140" },
  { credits: 500, priceBdt: 260, label: "500 SMS - ৳260" },
  { credits: 1000, priceBdt: 500, label: "1000 SMS - ৳500" },
  { credits: 2500, priceBdt: 1200, label: "2500 SMS - ৳1,200" },
  { credits: 5000, priceBdt: 2200, label: "5000 SMS - ৳2,200" },
];
