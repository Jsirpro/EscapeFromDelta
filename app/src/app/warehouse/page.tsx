"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";

import { LanguageToggle } from "../../components/LanguageToggle";
import { useI18n } from "../../i18n";
import { deriveCollectibleDisplay, deriveCollectibleDisplayFromCode } from "../../lib/loot";
import { usePlayerProfile } from "../../wallet/usePlayerProfile";

export default function WarehousePage() {
  const player = usePlayerProfile();
  const { t } = useI18n();
  const [listingPrices, setListingPrices] = useState<Record<string, string>>({});
  const collectibleAssets = player.warehouseAssets.filter((asset) => asset.assetType === "collectible");
  const tradableAssets = collectibleAssets.filter((asset) => asset.lockedState === "available");
  const safeCaseAssets = player.warehouseAssets.filter((asset) => asset.assetType === "safe_case");
  const collectibles = collectibleAssets.map((asset) => {
    const display = asset.collectibleCode
      ? deriveCollectibleDisplayFromCode(asset.collectibleCode, asset.address)
      : deriveCollectibleDisplay(asset.address);
    const rarity = asset.quality === "legendary" ? "legendary" : asset.quality === "epic" ? "epic" : display.rarity;
    return {
      ...display,
      rarity,
      collectibleCode: asset.collectibleCode ?? `${rarity}:fallback:${display.label}`,
      lockState: asset.lockedState,
      address: asset.address,
    };
  });
  const collectibleGroups = Array.from(
    collectibles.reduce((groups, item) => {
      const key = `${item.collectibleCode}:${item.lockState}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(key, { ...item, count: 1 });
      }
      return groups;
    }, new Map<string, typeof collectibles[number] & { count: number }>()),
  ).map(([, value]) => value);

  return (
    <div className="dashboard-home">
      <div className="dashboard-home-bg dashboard-home-scanlines" />
      <div className="dashboard-home-bg dashboard-home-radial" />

      <main className="shell dashboard-home-shell" style={{ paddingTop: 24 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link
              href="/"
              style={{
                width: 40,
                height: 40,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                borderRadius: 10,
                border: "1px solid transparent",
                transition: "all 0.2s",
              }}
              aria-label={t.common.backHome}
            >
              <IconArrowLeft size={24} />
            </Link>
            <div>
              <h1 style={{ margin: 0, fontSize: "3.6rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95 }}>{t.warehouse.title}</h1>
            </div>
          </div>

          <div
            style={{
              padding: 6,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <LanguageToggle />
          </div>
        </header>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, color: "#94a3b8", fontWeight: 800 }}>
          <IconCube size={18} style={{ color: "#10b981" }} />
          <span>{t.warehouse.balances}</span>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(420px, 0.95fr)",
            gap: 28,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
              <BalanceCard label={t.common.edcoins.toUpperCase()} value={player.edcoinsBalance.toString()} accent />
              <BalanceCard label={t.common.armorBalance} value={player.armorPointBalance.toFixed(1)} />
              <BalanceCard label={t.common.weaponBalance} value={player.weaponPointBalance.toFixed(1)} />
            </div>

            <Panel title={t.warehouse.storage} icon={<IconCube size={16} style={{ color: "#10b981" }} />}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <StorageRow
                  label={t.warehouse.safeCases}
                  value={safeCaseAssets.length === 0 ? t.common.none : String(safeCaseAssets.length)}
                  valueTone={safeCaseAssets.length === 0 ? "#ef4444" : "#34d399"}
                />
                <StorageRow label={t.warehouse.collectibles} value={String(collectibleAssets.length)} badge />
                <StorageRow label={t.warehouse.custody} value={t.warehouse.walletOwned} success />
              </div>

              {collectibleGroups.length === 0 ? (
                <p style={{ color: "#64748b", marginTop: 24 }}>{t.warehouse.noCollectibles}</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18, marginTop: 28 }}>
                  {collectibleGroups.map((item) => (
                    <div
                      key={`${item.collectibleCode}-${item.lockState}`}
                      style={{
                        borderRadius: 20,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(0,0,0,0.28)",
                        padding: "22px 22px 18px",
                        minHeight: 168,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 8 }}>
                          {item.rarity === "legendary" ? t.play.legendary : item.rarity === "epic" ? t.play.epic : t.play.rare}
                        </div>
                        <strong style={{ display: "block", fontSize: 24, lineHeight: 1.2, color: "#fff" }}>{translateWarehouseLabel(item.label, t)}</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 24 }}>
                        <span style={{ fontSize: 16, color: "#94a3b8" }}>X{item.count}</span>
                        <span
                          style={{
                            padding: "8px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(16,185,129,0.24)",
                            color: item.lockState === "available" ? "#34d399" : "#94a3b8",
                            background: item.lockState === "available" ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                            fontWeight: 800,
                          }}
                        >
                          {translateLockState(item.lockState, t)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <Panel title={t.warehouse.tradableAssets} icon={<IconTag size={16} style={{ color: "#10b981" }} />}>
              {tradableAssets.length === 0 ? (
                <p style={{ color: "#64748b" }}>{t.warehouse.noTradableAssets}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {tradableAssets.map((asset) => {
                    const display = asset.collectibleCode
                      ? deriveCollectibleDisplayFromCode(asset.collectibleCode, asset.address)
                      : deriveCollectibleDisplay(asset.address);
                    const priceValue = listingPrices[asset.address] ?? "";
                    const parsedPrice = Number.parseInt(priceValue || "0", 10);
                    const feePreview = Number.isFinite(parsedPrice) && parsedPrice > 0 ? Math.ceil(parsedPrice * 0.03) : 0;
                    const canList = Boolean(asset.collectibleCode);
                    return (
                      <div
                        key={asset.address}
                        style={{
                          borderRadius: 24,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(0,0,0,0.2)",
                          padding: 28,
                          display: "flex",
                          flexDirection: "column",
                          gap: 18,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 10 }}>
                              {display.rarity === "legendary" ? t.play.legendary : display.rarity === "epic" ? t.play.epic : t.play.rare}
                            </div>
                            <strong style={{ display: "block", fontSize: 24, lineHeight: 1.2, color: "#fff" }}>{translateWarehouseLabel(display.label, t)}</strong>
                          </div>
                          <IconCube size={28} style={{ color: "rgba(16,185,129,0.28)" }} />
                        </div>

                        <div>
                          <div style={{ fontSize: 14, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>{t.warehouse.assetAddress}</div>
                          <div
                            style={{
                              borderRadius: 16,
                              border: "1px solid rgba(255,255,255,0.06)",
                              background: "#0b1015",
                              padding: "16px 18px",
                              color: "#94a3b8",
                              wordBreak: "break-all",
                            }}
                          >
                            {asset.address}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 14, color: "#64748b", fontWeight: 700, marginBottom: 12 }}>{t.warehouse.listingPrice}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 140px", gap: 14 }}>
                            <input
                              min="1"
                              step="1"
                              type="number"
                              value={priceValue}
                              disabled={!canList}
                              onChange={(event) =>
                                setListingPrices((current) => ({
                                  ...current,
                                  [asset.address]: event.target.value,
                                }))
                              }
                              style={{
                                width: "100%",
                                minHeight: 64,
                                borderRadius: 18,
                                border: "1px solid rgba(255,255,255,0.08)",
                                background: "#0b1015",
                                padding: "0 22px",
                                color: "#dbe4ee",
                                fontSize: 22,
                                fontWeight: 800,
                              }}
                            />
                            <button
                              className="button"
                              type="button"
                              disabled={!canList || !Number.isFinite(parsedPrice) || parsedPrice <= 0}
                              onClick={async () => {
                                await player.createMarketplaceListing(asset.address, parsedPrice);
                                setListingPrices((current) => ({
                                  ...current,
                                  [asset.address]: "",
                                }));
                              }}
                              style={{ minHeight: 64, borderRadius: 18, fontSize: 16 }}
                            >
                              {t.warehouse.listAsset}
                            </button>
                          </div>
                        </div>

                        <div style={{ color: "#64748b", fontStyle: "italic", fontWeight: 700 }}>
                          {t.warehouse.listingFeePreview.replace("{fee}", feePreview.toString())}
                        </div>
                        {!canList ? <div style={{ color: "#f87171", fontSize: 14 }}>{t.warehouse.legacyAssetBlocked}</div> : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
{/* 
            <Panel title="仓库调试终端" icon={<IconCode size={16} style={{ color: "#10b981" }} />} rightLabel="SYSTEM_READY">
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(16,185,129,0.2)",
                  background: "rgba(0,0,0,0.3)",
                  padding: 24,
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "#6ee7b7",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  }}
                >
                  {JSON.stringify(
                    {
                      walletAddress: player.walletAddress,
                      connected: player.connected,
                      warehouseAssetCount: player.warehouseAssets.length,
                      rpcStatus: player.warehouseAssetsDebug ? 200 : 0,
                      assets: player.warehouseAssets.map((asset) => ({
                        id: asset.assetId,
                        type: asset.quality?.toUpperCase() ?? asset.assetType.toUpperCase(),
                      })),
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </Panel> */}
          </div>
        </section>
      </main>
    </div>
  );
}

function translateWarehouseLabel(label: string, t: ReturnType<typeof useI18n>["t"]) {
  const collectibleMatch = /^(Legendary|Epic|Rare) Collectible(?: (\d+))?$/.exec(label);
  if (collectibleMatch) {
    const rarityLabel =
      collectibleMatch[1] === "Legendary"
        ? t.play.legendary
        : collectibleMatch[1] === "Epic"
          ? t.play.epic
          : t.play.rare;
    const serial = collectibleMatch[2];
    return serial ? `${rarityLabel}收藏品 ${serial}` : `${rarityLabel}收藏品`;
  }
  return label;
}

function translateLockState(lockState: string, t: ReturnType<typeof useI18n>["t"]) {
  if (lockState === "listed") return t.warehouse.listed;
  if (lockState === "in_raid") return t.warehouse.inRaid;
  if (lockState === "consumed") return t.warehouse.consumed;
  return t.warehouse.available;
}

function Panel({
  title,
  icon,
  rightLabel,
  children,
}: {
  title: string;
  icon: ReactNode;
  rightLabel?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.22)",
        padding: 28,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", fontWeight: 800 }}>
          {icon}
          <span>{title}</span>
        </div>
        {rightLabel ? <span style={{ color: "#166534", fontWeight: 800, letterSpacing: "0.06em" }}>{rightLabel}</span> : null}
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 24 }} />
      {children}
    </section>
  );
}

function BalanceCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        minHeight: 150,
        borderRadius: 24,
        border: accent ? "1px solid rgba(16,185,129,0.28)" : "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.24)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ color: accent ? "#10b981" : "#64748b", fontSize: 15, fontWeight: 900, letterSpacing: "0.18em" }}>{label}</span>
      <strong style={{ color: accent ? "#34d399" : "#fff", fontSize: 54, lineHeight: 1, fontWeight: 900 }}>{value}</strong>
    </div>
  );
}

function StorageRow({
  label,
  value,
  badge = false,
  success = false,
  valueTone,
}: {
  label: string;
  value: string;
  badge?: boolean;
  success?: boolean;
  valueTone?: string;
}) {
  return (
    <div
      style={{
        minHeight: 74,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.22)",
        padding: "0 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ color: "#94a3b8", fontWeight: 800, fontSize: 16 }}>{label}</span>
      {badge ? (
        <span
          style={{
            minWidth: 40,
            height: 40,
            borderRadius: 12,
            background: "#34d399",
            color: "#032116",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 24,
          }}
        >
          {value}
        </span>
      ) : success ? (
        <span
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid rgba(16,185,129,0.22)",
            color: "#34d399",
            background: "rgba(16,185,129,0.08)",
            fontWeight: 800,
          }}
        >
          {value}
        </span>
      ) : (
        <span style={{ color: valueTone ?? "#fff", fontWeight: 900, fontSize: 32 }}>{value}</span>
      )}
    </div>
  );
}

function IconArrowLeft({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconCube({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function IconTag({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function IconCode({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
