"use client";

import { LanguageToggle } from "../../components/LanguageToggle";
import { useI18n } from "../../i18n";
import { usePlayerProfile } from "../../wallet/usePlayerProfile";

export default function WarehousePage() {
  const player = usePlayerProfile();
  const { t } = useI18n();
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
        </div>
      </section>
    </main>
  );
}
