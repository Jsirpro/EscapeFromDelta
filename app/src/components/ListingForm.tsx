"use client";

import { useMemo, useState } from "react";

import { useI18n } from "../i18n";
import { deriveCollectibleDisplay, deriveCollectibleDisplayFromCode } from "../lib/loot";
import { usePlayerProfile } from "../wallet/usePlayerProfile";

export function listingFeePreview(priceEdcoins: bigint): bigint {
  if (priceEdcoins <= 0n) return 0n;
  return (priceEdcoins * 3n + 99n) / 100n;
}

export function ListingForm() {
  const { t, language } = useI18n();
  const player = usePlayerProfile();

  const tradableAssets = useMemo(
    () =>
      player.warehouseAssets.filter(
        (asset: (typeof player.warehouseAssets)[number]) =>
          asset.assetType === "collectible" && asset.lockedState === "available" && Boolean(asset.collectibleCode),
      ),
    [player.warehouseAssets],
  );

  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [priceInput, setPriceInput] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selected = tradableAssets.find((asset) => asset.address === selectedAddress);
  const priceNumber = Number.parseInt(priceInput || "0", 10);
  const priceValid = Number.isFinite(priceNumber) && priceNumber > 0;
  const feeValue = priceValid ? Math.ceil(priceNumber * 0.03) : 0;

  const canSubmit = Boolean(selected) && priceValid && !submitting;

  async function handleSubmit() {
    if (!selected || !priceValid) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await player.createMarketplaceListing(selected.address, priceNumber);
      setPriceInput("");
      setSelectedAddress("");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "unknown-error");
    } finally {
      setSubmitting(false);
    }
  }

  if (tradableAssets.length === 0) {
    return (
      <p style={{ margin: 0, color: "#64748b", fontSize: 14, fontWeight: 700 }}>{t.marketplace.noTradableAsset}</p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontSize: 12, color: "#64748b", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {t.marketplace.selectAsset}
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))", gap: 10 }}>
          {tradableAssets.map((asset) => {
            const display = asset.collectibleCode
              ? deriveCollectibleDisplayFromCode(asset.collectibleCode, asset.address)
              : deriveCollectibleDisplay(asset.address);
            const meta = display.meta;
            const name = meta ? (language === "zh" ? meta.nameCn : meta.nameEn) : display.label;
            const isSelected = asset.address === selectedAddress;
            return (
              <button
                type="button"
                key={asset.address}
                onClick={() => setSelectedAddress(asset.address)}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${isSelected ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.08)"}`,
                  background: isSelected ? "rgba(16,185,129,0.1)" : "rgba(0,0,0,0.28)",
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                {meta ? (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: 8,
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
                <div style={{ minHeight: 0 }}>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color:
                        display.rarity === "legendary" ? "#f59e0b" : display.rarity === "epic" ? "#a855f7" : "#34d399",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    {display.rarity === "legendary" ? t.play.legendary : display.rarity === "epic" ? t.play.epic : t.play.rare}
                  </div>
                  <strong
                    style={{
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 800,
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {name}
                  </strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontSize: 12, color: "#64748b", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {t.marketplace.price}
        </label>
        <input
          type="number"
          min={1}
          value={priceInput}
          onChange={(event) => setPriceInput(event.target.value)}
          placeholder="0"
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.35)",
            color: "#fff",
            fontSize: 18,
            fontWeight: 800,
            outline: "none",
          }}
        />
        <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>{t.marketplace.fee}</span>
        {priceValid ? (
          <span style={{ color: "#34d399", fontSize: 12, fontWeight: 800 }}>
            {t.marketplace.feePreview.replace("{fee}", feeValue.toString())}
          </span>
        ) : null}
      </div>

      {submitError ? (
        <p style={{ margin: 0, color: "#ef4444", fontSize: 13, fontWeight: 700 }}>{submitError}</p>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => void handleSubmit()}
        style={{
          padding: "14px 18px",
          borderRadius: 14,
          border: "1px solid rgba(16,185,129,0.32)",
          background: canSubmit ? "rgba(16,185,129,0.92)" : "rgba(16,185,129,0.12)",
          color: canSubmit ? "#04120c" : "#34d399",
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: canSubmit ? "pointer" : "not-allowed",
          transition: "all 0.15s",
        }}
      >
        {submitting ? "…" : t.marketplace.createListing}
      </button>
    </div>
  );
}
