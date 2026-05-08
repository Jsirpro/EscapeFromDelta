"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EdcoinsConversionPanel } from "../components/EdcoinsConversionPanel";
import { LanguageToggle } from "../components/LanguageToggle";
import { translateWalletError, useI18n } from "../i18n";
import { usePlayerProfile } from "../wallet/usePlayerProfile";
import { BattleRecords } from "./components/BattleRecords";
import { PlayerHUD } from "./components/PlayerHUD";
import { RaidFeedMap } from "./components/RaidFeedMap";

export default function PlayerHomePage() {
  const player = usePlayerProfile();
  const { language, t } = useI18n();
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const walletError = useMemo(() => translateWalletError(player.walletError, language), [player.walletError, language]);
  const displayAddress = useMemo(() => {
    if (!player.walletAddress) return t.wallet.connect.toUpperCase();
    return `${player.walletAddress.slice(0, 4)}...${player.walletAddress.slice(-4)}`;
  }, [player.walletAddress, t.wallet.connect]);

  return (
    <div className="dashboard-home">
      <div className="dashboard-home-bg dashboard-home-scanlines" />
      <div className="dashboard-home-bg dashboard-home-radial" />

      <main className="shell dashboard-home-shell">
        <header className="topbar dashboard-topbar">
          <div className="brand">
            <h1 className="dashboard-logo">ESCAPE FROM DELTA</h1>
            <p className="eyebrow dashboard-logo-subtitle">{t.home.eyebrow}</p>
          </div>

          <div className="toolbar dashboard-toolbar">
            <LanguageToggle />

            <div style={{ position: "relative" }}>
              <button
                className="topbar-wallet-button"
                type="button"
                onClick={() => {
                  if (player.connected) {
                    setIsWalletDropdownOpen((current) => !current);
                  } else {
                    void player.connectDemoWallet();
                  }
                }}
              >
                <div className={`topbar-wallet-indicator ${player.connected ? "" : "disconnected"}`} />
                <div className="topbar-wallet-content">
                  <p className="topbar-wallet-address">{displayAddress}</p>
                </div>
                <span className="topbar-wallet-chevron" style={{ transform: isWalletDropdownOpen ? "rotate(180deg)" : "none" }}>
                  ▼
                </span>
              </button>

              {isWalletDropdownOpen && player.connected ? (
                <div className="dashboard-wallet-menu">
                  <button
                    className="dashboard-wallet-disconnect"
                    type="button"
                    onClick={() => {
                      void player.disconnect();
                      setIsWalletDropdownOpen(false);
                    }}
                  >
                    {t.wallet.disconnect}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {walletError ? (
          <div className="alert dashboard-alert" role="alert">
            {walletError}
          </div>
        ) : null}

        <section className="dashboard dashboard-home-grid">
          <div className="dashboard-column">
            <div className="dashboard-panel">
              <h3 className="dashboard-panel-header">
                <IconTrendingUp size={14} style={{ color: "var(--accent)" }} /> {t.dashboard.myAssets}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <AssetCard icon={<IconBox style={{ color: "#f59e0b" }} />} label={t.common.edcoins} value={player.edcoinsBalance.toLocaleString()} />
                <AssetCard icon={<IconShield style={{ color: "#06b6d4" }} />} label={t.common.armor} value={player.armorPointBalance.toFixed(1)} />
                <AssetCard icon={<IconSword style={{ color: "#ef4444" }} />} label={t.common.weapon} value={player.weaponPointBalance.toFixed(1)} />
              </div>
            </div>

            <EdcoinsConversionPanel />
          </div>

          <div className="dashboard-column">
            <RaidFeedMap />

            <Link href="/play" style={{ textDecoration: "none" }}>
              <button className="btn-deploy" type="button">
                <div className="content">
                  <IconNavigation className="icon" />
                  <span className="title">{t.dashboard.deployToRaid}</span>
                  <span className="subtitle">{t.dashboard.targetLocation}</span>
                </div>
                <div className="scan-effect" />
              </button>
            </Link>

            <div className="dashboard-nav-grid">
              <NavButton icon={<IconShoppingCart size={20} />} label={t.nav.marketplace} href="/marketplace" />
              <NavButton icon={<IconBox size={20} />} label={t.nav.warehouse} href="/warehouse" />
              <NavButton icon={<IconHistory size={20} />} label={t.dashboard.raidHistory} href="/records" />
              <NavButton icon={<IconUser size={20} />} label={t.dashboard.adminTools} href="/admin" />
            </div>
          </div>

          <div className="dashboard-column">
            <PlayerHUD />
            <BattleRecords />
          </div>
        </section>
      </main>

      <footer className="dashboard-footer-glow" />
    </div>
  );
}

const IconTrendingUp = ({
  size = 24,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const IconBox = ({
  size = 24,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

const IconShield = ({
  size = 24,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
);

const IconSword = ({
  size = 24,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="20" y2="20" />
  </svg>
);

const IconShoppingCart = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const IconUser = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconHistory = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <polyline points="3 3 3 8 8 8" />
    <polyline points="12 7 12 12 15 15" />
  </svg>
);

const IconNavigation = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

function AssetCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="asset-card-wrapper">
      <div className="asset-card-icon">{icon}</div>
      <div>
        <p className="asset-card-label">{label}</p>
        <p className="asset-card-value">{value}</p>
      </div>
    </div>
  );
}

function NavButton({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <button className="nav-button-wrapper" type="button">
        <div className="nav-button-icon">{icon}</div>
        <span className="nav-button-label">{label}</span>
      </button>
    </Link>
  );
}
