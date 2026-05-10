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
  const { t, language } = useI18n();
  const player = usePlayerProfile();
  const [listings, setListings] = useState<ListingWithAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAddress, setBusyAddress] = useState<string | null>(null);

  async function refreshListings() {
    setLoading(true);
    try {
      const response = await fetch("/api/listings", { cache: "no-store" });
      const payload = await response.json();
      setListings(payload.listings ?? []);
      setError(payload.error ?? null);
    } catch (fetchError) {
      setListings([]);
      setError(fetchError instanceof Error ? fetchError.message : "unknown-error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "32px 16px",
          textAlign: "center",
          color: "#64748b",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.06em",
        }}
      >
        {t.marketplace.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <p style={{ margin: 0, color: "#ef4444", fontSize: 14, fontWeight: 800 }}>{t.marketplace.loadFailed}</p>
        <p style={{ margin: 0, color: "#64748b", fontSize: 12, fontWeight: 700, opacity: 0.8 }}>{error}</p>
        <button
          type="button"
          onClick={() => void refreshListings()}
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            border: "1px solid rgba(16,185,129,0.32)",
            background: "rgba(16,185,129,0.08)",
            color: "#34d399",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {t.marketplace.retry}
        </button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <p style={{ margin: 0, color: "#64748b", fontSize: 14, fontWeight: 700 }}>{t.common.noActiveListings}</p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ margin: 0, color: "#64748b", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em" }}>
        {t.marketplace.listingsCount.replace("{count}", String(listings.length))}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
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
          const meta = display.meta;
          const name = meta ? (language === "zh" ? meta.nameCn : meta.nameEn) : display.label;
          const description = meta ? (language === "zh" ? meta.descriptionCn : meta.descriptionEn) : null;
          const rarityColor = rarity === "legendary" ? "#f59e0b" : rarity === "epic" ? "#a855f7" : "#34d399";
          const rarityLabel = rarity === "legendary" ? t.play.legendary : rarity === "epic" ? t.play.epic : t.play.rare;
          const busy = busyAddress === listing.address;
          return (
            <div
              key={listing.address}
              style={{
                borderRadius: 18,
                border: `1px solid ${isOwnListing ? "rgba(245,158,11,0.28)" : "rgba(255,255,255,0.08)"}`,
                background: "rgba(0,0,0,0.26)",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {meta ? (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "#05080c",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={meta.image}
                    alt={name}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              ) : null}

              <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: rarityColor,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  {rarityLabel}
                </div>
                <strong style={{ color: "#fff", fontSize: 15, fontWeight: 900, lineHeight: 1.35 }}>{name}</strong>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#94a3b8",
                    fontSize: 12,
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: "2.9em",
                  }}
                >
                  {description ?? ""}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.18)",
                }}
              >
                <span style={{ color: "#64748b", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {t.marketplace.price}
                </span>
                <strong style={{ color: "#34d399", fontSize: 16, fontWeight: 900 }}>{listing.priceEdcoins}</strong>
              </div>

              <button
                type="button"
                disabled={!player.connected || busy}
                onClick={async () => {
                  setBusyAddress(listing.address);
                  try {
                    if (isOwnListing) {
                      await player.cancelMarketplaceListing(listing.address);
                    } else {
                      await player.purchaseMarketplaceListing(listing.address);
                    }
                    await refreshListings();
                  } finally {
                    setBusyAddress(null);
                  }
                }}
                style={{
                  marginTop: "auto",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: isOwnListing
                    ? "1px solid rgba(245,158,11,0.32)"
                    : "1px solid rgba(16,185,129,0.32)",
                  background: !player.connected || busy
                    ? "rgba(255,255,255,0.04)"
                    : isOwnListing
                      ? "rgba(245,158,11,0.12)"
                      : "rgba(16,185,129,0.92)",
                  color: !player.connected || busy
                    ? "#64748b"
                    : isOwnListing
                      ? "#f59e0b"
                      : "#04120c",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: !player.connected || busy ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {busy ? "…" : isOwnListing ? t.marketplace.cancel : t.marketplace.buy}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
