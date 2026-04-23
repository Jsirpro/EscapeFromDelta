"use client";

import { useI18n } from "../i18n";

export function listingFeePreview(priceEdcoins: bigint): bigint {
  if (priceEdcoins <= 0n) return 0n;
  return (priceEdcoins * 3n + 99n) / 100n;
}

export function ListingForm() {
  const { t } = useI18n();
  return (
    <form>
      <label>
        {t.marketplace.price}
        <input min="1" name="price" type="number" />
      </label>
      <p>{t.marketplace.fee}</p>
      <button className="button" type="button">
        {t.marketplace.createListing}
      </button>
    </form>
  );
}
