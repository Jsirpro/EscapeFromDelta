"use client";

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
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">{t.warehouse.eyebrow}</p>
          <h1>{t.warehouse.title}</h1>
        </div>
        <LanguageToggle />
      </header>

      <section className="inventory-grid">
        <div className="control-surface">
          <h2>{t.warehouse.balances}</h2>
          <div className="stat-strip">
            <div className="stat-card">
              <span className="stat-label">{t.common.edcoins}</span>
              <strong className="stat-value">{player.edcoinsBalance.toString()}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">{t.common.armorBalance}</span>
              <strong className="stat-value">{player.armorPointBalance.toFixed(1)}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">{t.common.weaponBalance}</span>
              <strong className="stat-value">{player.weaponPointBalance.toFixed(1)}</strong>
            </div>
          </div>
        </div>

        <div className="control-surface">
          <h2>{t.warehouse.storage}</h2>
          <ul className="inventory-list">
            <li className="inventory-item">
              <span>{t.warehouse.safeCases}</span>
              <span className="pill">{t.common.none}</span>
            </li>
            <li className="inventory-item">
              <span>{t.warehouse.collectibles}</span>
              <span className="pill">{player.warehouseAssets.length}</span>
            </li>
            <li className="inventory-item">
              <span>{t.warehouse.custody}</span>
              <span className="pill">{t.warehouse.walletOwned}</span>
            </li>
          </ul>
          {collectibleGroups.length === 0 ? (
            <p>{t.warehouse.noCollectibles}</p>
          ) : (
            <div className="loot-grid">
              {collectibleGroups.map((item) => (
                <div className={`loot-card loot-${item.rarity}`} key={`${item.collectibleCode}-${item.lockState}`}>
                  <span className="field-label">
                    {item.rarity === "legendary" ? t.play.legendary : item.rarity === "epic" ? t.play.epic : t.play.rare}
                  </span>
                  <strong>{translateWarehouseLabel(item.label, t)}</strong>
                  <p>x{item.count}</p>
                  <p className="field-label">{translateLockState(item.lockState, t)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="control-surface">
          <h2>{t.warehouse.tradableAssets}</h2>
          {tradableAssets.length === 0 ? (
            <p>{t.warehouse.noTradableAssets}</p>
          ) : (
            <div className="loot-grid">
              {tradableAssets.map((asset) => {
                const display = asset.collectibleCode
                  ? deriveCollectibleDisplayFromCode(asset.collectibleCode, asset.address)
                  : deriveCollectibleDisplay(asset.address);
                const priceValue = listingPrices[asset.address] ?? "";
                const parsedPrice = Number.parseInt(priceValue || "0", 10);
                const feePreview = Number.isFinite(parsedPrice) && parsedPrice > 0 ? Math.ceil(parsedPrice * 0.03) : 0;
                const canList = Boolean(asset.collectibleCode);
                return (
                  <div className={`loot-card loot-${display.rarity}`} key={asset.address}>
                    <span className="field-label">
                      {display.rarity === "legendary" ? t.play.legendary : display.rarity === "epic" ? t.play.epic : t.play.rare}
                    </span>
                    <strong>{translateWarehouseLabel(display.label, t)}</strong>
                    <p className="field-label">{t.warehouse.assetAddress}</p>
                    <p className="debug-block">{asset.address}</p>
                    <label className="form-field">
                      <span>{t.warehouse.listingPrice}</span>
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
                      />
                    </label>
                    <p className="field-label">{t.warehouse.listingFeePreview.replace("{fee}", feePreview.toString())}</p>
                    {!canList ? <p className="field-label">{t.warehouse.legacyAssetBlocked}</p> : null}
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
                    >
                      {t.warehouse.listAsset}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="control-surface">
          <h2>Warehouse Debug</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "12px", lineHeight: 1.5 }}>
            {JSON.stringify(
              {
                walletAddress: player.walletAddress,
                connected: player.connected,
                onChainProfileLoaded: player.onChainProfileLoaded,
                warehouseAssetCount: player.warehouseAssets.length,
                collectibleAssetCount: collectibleAssets.length,
                warehouseAssetsDebug: player.warehouseAssetsDebug,
              },
              null,
              2,
            )}
          </pre>
        </div>
      </section>
    </main>
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
