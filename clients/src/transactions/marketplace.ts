import { createSummary, type TransactionSummary } from "./summary";

export type MarketplaceIntent = "create_listing" | "purchase_listing" | "cancel_listing";

export function listingFee(priceEdcoins: bigint): bigint {
  if (priceEdcoins <= 0n) throw new Error("invalid-price");
  return (priceEdcoins * 3n + 99n) / 100n;
}

export function buildMarketplaceSummary(
  intent: MarketplaceIntent,
  wallet: string,
  priceEdcoins = 0n,
): TransactionSummary {
  return createSummary({
    intent,
    cluster: "localnet",
    feePayer: wallet,
    programId: process.env.PROGRAM_ID ?? "11111111111111111111111111111111",
    accounts: [wallet],
    amounts: priceEdcoins > 0n ? [{ label: "listing fee", value: listingFee(priceEdcoins).toString() }] : [],
  });
}
