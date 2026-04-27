"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { deriveCollectibleDisplay, deriveCollectibleDisplayFromCode } from "../lib/loot";

interface ListingWithAsset {
  address: string;
  listingId: string;
  sellerProfile: string;
  assetId: string;
  priceEdcoins: string;
  feePaidEdcoins: string;
  status: string;
  asset?: {
    address: string;
    quality?: "common" | "uncommon" | "rare" | "epic" | "legendary";
    collectibleCode?: string;
  } | null;
}

export function MarketplaceListings() {
  const { t } = useI18n();
  const [listings, setListings] = useState<ListingWithAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/listings", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        setListings(payload.listings ?? []);
        setError(payload.error ?? null);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setListings([]);
        setError(fetchError instanceof Error ? fetchError.message : "unknown-error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h2>{t.marketplace.listings}</h2>
      {error ? <p>{error}</p> : null}
      {listings.length === 0 ? (
        <p>{t.common.noActiveListings}</p>
      ) : (
        <div className="loot-grid">
          {listings.map((listing) => {
            const display = listing.asset?.collectibleCode
              ? deriveCollectibleDisplayFromCode(listing.asset.collectibleCode, listing.asset.address)
              : deriveCollectibleDisplay(listing.asset?.address ?? listing.assetId);
            const rarity =
              listing.asset?.quality === "legendary"
                ? "legendary"
                : listing.asset?.quality === "epic"
                  ? "epic"
                  : display.rarity;
            return (
              <div className={`loot-card loot-${rarity}`} key={listing.address}>
                <span className="field-label">
                  {rarity === "legendary" ? t.play.legendary : rarity === "epic" ? t.play.epic : t.play.rare}
                </span>
                <strong>{display.label}</strong>
                <p>
                  {t.marketplace.price}: {listing.priceEdcoins}
                </p>
                <p className="field-label">
                  {t.marketplace.feeCharged}: {listing.feePaidEdcoins}
                </p>
                <p className="field-label">
                  {t.marketplace.seller}: {listing.sellerProfile}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
