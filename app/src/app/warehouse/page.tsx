"use client";

import { LanguageToggle } from "../../components/LanguageToggle";
import { useI18n } from "../../i18n";
import { deriveCollectibleDisplay } from "../../lib/loot";
import { usePlayerProfile } from "../../wallet/usePlayerProfile";

export default function WarehousePage() {
  const player = usePlayerProfile();
  const { t } = useI18n();
  const collectibles = player.battleRecords.flatMap((record) => record.retainedAssets).map(deriveCollectibleDisplay);
  const collectibleGroups = Array.from(
    collectibles.reduce((groups, item) => {
      const key = `${item.rarity}:${item.label}`;
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
              <span className="pill">{t.warehouse.raidRecords}</span>
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
                <div className={`loot-card loot-${item.rarity}`} key={`${item.rarity}-${item.label}`}>
                  <span className="field-label">
                    {item.rarity === "legendary" ? t.play.legendary : item.rarity === "epic" ? t.play.epic : t.play.rare}
                  </span>
                  <strong>{translateLootLabel(item.label, t)}</strong>
                  <p>x{item.count}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function translateLootLabel(label: string, t: ReturnType<typeof useI18n>["t"]) {
  if (label.startsWith("Legendary Collectible ")) {
    return `${t.play.legendary}收藏品${label.replace("Legendary Collectible ", "")}`;
  }
  if (label.startsWith("Epic Collectible ")) {
    return `${t.play.epic}收藏品${label.replace("Epic Collectible ", "")}`;
  }
  if (label.startsWith("Rare Collectible ")) {
    return `${t.play.rare}收藏品${label.replace("Rare Collectible ", "")}`;
  }
  return label;
}
