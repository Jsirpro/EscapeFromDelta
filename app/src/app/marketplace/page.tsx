"use client";

import { LanguageToggle } from "../../components/LanguageToggle";
import { ListingForm } from "../../components/ListingForm";
import { MarketplaceListings } from "../../components/MarketplaceListings";
import { useI18n } from "../../i18n";

export default function MarketplacePage() {
  const { t } = useI18n();
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">{t.marketplace.eyebrow}</p>
          <h1>{t.marketplace.title}</h1>
        </div>
        <LanguageToggle />
      </header>
      <section className="market-grid">
        <div className="control-surface">
          <ListingForm />
        </div>
        <div className="control-surface">
          <MarketplaceListings />
        </div>
      </section>
    </main>
  );
}
