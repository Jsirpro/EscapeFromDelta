"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { deriveCollectibleDisplay, deriveCollectibleDisplayFromCode } from "../lib/loot";
import { usePlayerProfile } from "../wallet/usePlayerProfile";

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
  const player = usePlayerProfile();
  const [listings, setListings] = useState<ListingWithAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refreshListings() {
    const response = await fetch("/api/listings", { cache: "no-store" });
    const payload = await response.json();
    setListings(payload.listings ?? []);
    setError(payload.error ?? null);
  }

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
            const isOwnListing = player.onChainProfileAddress === listing.sellerProfile;
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
                <button
                  className="button"
                  type="button"
                  disabled={!player.connected}
                  onClick={async () => {
                    if (isOwnListing) {
                      await player.cancelMarketplaceListing(listing.address);
                    } else {
                      await player.purchaseMarketplaceListing(listing.address);
                    }
                    await refreshListings();
                  }}
                >
                  {isOwnListing ? t.marketplace.cancel : t.marketplace.buy}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
