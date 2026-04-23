"use client";

import { useI18n } from "../i18n";

export function MarketplaceListings() {
  const { t } = useI18n();
  return (
    <section>
      <h2>{t.marketplace.listings}</h2>
      <p>{t.common.noActiveListings}</p>
    </section>
  );
}
