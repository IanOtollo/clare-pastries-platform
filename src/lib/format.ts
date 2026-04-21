// Approx fixed conversion (KES → UGX). Real app would fetch Frankfurter.
export const KES_TO_UGX = 28;

export function formatKES(amount: number) {
  return `KES ${amount.toLocaleString("en-KE")}`;
}
export function formatUGX(amountKes: number) {
  const ugx = Math.round(amountKes * KES_TO_UGX);
  return `UGX ${ugx.toLocaleString("en-UG")}`;
}
export function formatPrice(amountKes: number, currency: "KES" | "UGX" = "KES") {
  return currency === "UGX" ? formatUGX(amountKes) : formatKES(amountKes);
}
