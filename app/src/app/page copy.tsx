"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";

import { EdcoinsConversionPanel } from "../components/EdcoinsConversionPanel";
import { LanguageToggle } from "../components/LanguageToggle";
import { useI18n } from "../i18n";
import { usePlayerProfile } from "../wallet/usePlayerProfile";

// New Dashboard Components
import { RaidFeedMap } from "./components/RaidFeedMap";
import { PlayerHUD } from "./components/PlayerHUD";
import { BattleRecords } from "./components/BattleRecords";

export default function PlayerHomePage() {
  const player = usePlayerProfile();
  const { t } = useI18n();
  const [showError, setShowError] = useState(true);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);

  const displayAddress = useMemo(() => {
    if (!player.walletAddress) return "CONNECT WALLET";
    return `${player.walletAddress.slice(0, 4)}...${player.walletAddress.slice(-4)}`;
  }, [player.walletAddress]);

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      {/* 扫描线背景效果 */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }}></div>
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(16,32,24,0.1)_0%,transparent_100%)]"></div>

      <main className="shell relative z-10">
        <header className="topbar" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "20px", marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="brand">
            <h1 style={{ fontSize: "2rem", fontWeight: 900, background: "linear-gradient(to right, #34d399, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0, padding: 0 }}>
              ESCAPE FROM DELTA
            </h1>
            <p className="eyebrow" style={{ color: "rgba(52, 211, 153, 0.6)", letterSpacing: "0.2em", fontSize: "10px", margin: 0 }}>
              AN ON-CHAIN EXTRACTION RAID
            </p>
          </div>

          <div className="toolbar" style={{ gap: "12px", display: "flex", alignItems: "center" }}>
            {/* <button className="topbar-tool-button" style={{ width: "42px", height: "42px" }}>
              <IconBell size={18} />
              <span style={{ position: "absolute", top: "10px", right: "10px", width: "6px", height: "6px", background: "#ef4444", borderRadius: "50%", border: "1px solid #05070a" }}></span>
            </button> */}

            <LanguageToggle />

            <div style={{ position: "relative" }}>
              <div className="topbar-wallet-button" style={{ height: "42px", padding: "0 16px" }} onClick={() => {
                if (player.connected) {
                  setIsWalletDropdownOpen(!isWalletDropdownOpen);
                } else {
                  player.connectDemoWallet();
                }
              }}>
                <div className={`topbar-wallet-indicator ${player.connected ? '' : 'disconnected'}`}></div>
                <div className="topbar-wallet-content">
                  <p className="topbar-wallet-address">{displayAddress}</p>
                  {/* <p className="topbar-wallet-network">SOLANA LOCALNET</p> */}
                </div>
                <span className="topbar-wallet-chevron" style={{ transform: isWalletDropdownOpen ? "rotate(180deg)" : "none" }}>▼</span>
              </div>

              {isWalletDropdownOpen && player.connected && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                  background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", padding: "4px", zIndex: 100,
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                  backdropFilter: "blur(10px)"
                }}>
                  <button
                    style={{
                      width: "100%", padding: "12px", background: "transparent",
                      border: "none", color: "#f87171", fontSize: "13px",
                      fontWeight: "900", textAlign: "center", cursor: "pointer",
                      borderRadius: "8px", transition: "background 0.2s",
                      textTransform: "uppercase", letterSpacing: "0.05em"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    onClick={() => {
                      player.disconnect();
                      setIsWalletDropdownOpen(false);
                    }}
                  >
                    {t.common?.disconnect || "Disconnect"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="dashboard">
          {/* LEFT COLUMN: ASSETS & EXCHANGE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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

          {/* CENTER COLUMN: FEED & MAIN ACTIONS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <RaidFeedMap />

            <Link href="/play" style={{ textDecoration: "none" }}>
              <button className="btn-deploy">
                <div className="content">
                  <IconNavigation className="icon" />
                  <span className="title">{t.dashboard.deployToRaid}</span>
                  <span className="subtitle">{t.dashboard.targetLocation}</span>
                </div>
                <div className="scan-effect"></div>
              </button>
            </Link>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <NavButton icon={<IconShoppingCart size={20} />} label={t.dashboard.openMarket} href="/marketplace" />
              <NavButton icon={<IconBox size={20} />} label={t.dashboard.warehouse} href="/warehouse" />
              <NavButton icon={<IconUser size={20} />} label={t.dashboard.inventory} href="/inventory" />
              <NavButton icon={<IconHistory size={20} />} label={t.dashboard.raidHistory} href="/records" />
            </div>
          </div>

          {/* RIGHT COLUMN: HUD & RECORDS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <PlayerHUD />
            <BattleRecords />
          </div>
        </section>

        {/* Error Popup Mockup from test code */}
        {showError && !player.connected && (
          <div style={{ position: "fixed", top: "100px", right: "32px", zIndex: 100, animation: "slideIn 0.5s ease" }}>
            <div style={{ background: "rgba(239, 68, 68, 0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", padding: "20px", boxShadow: "0 0 40px rgba(239, 68, 68, 0.2)", maxWidth: "384px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ background: "rgba(239, 68, 68, 0.2)", padding: "8px", borderRadius: "8px", color: "#ef4444", fontSize: "24px" }}>
                  <IconAlertCircle size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ color: "#ef4444", fontWeight: 900, fontSize: "14px" }}>DATA FETCH ERROR</span>
                    <button onClick={() => setShowError(false)} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                  </div>
                  <p style={{ fontSize: "12px", color: "white", margin: 0 }}>获取账户 {displayAddress} 的链上信息失败。</p>
                  <p style={{ fontSize: "10px", color: "rgba(239, 68, 68, 0.6)", fontFamily: "monospace", marginTop: "4px" }}>(TypeError: fetch failed)</p>
                  <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    <button onClick={player.connectDemoWallet} style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", fontSize: "10px", fontWeight: 900, padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>RETRY</button>
                    <button onClick={() => setShowError(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>DISMISS</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></footer>
    </div>
  );
}

// Icon Components using inline SVGs to match Lucide
const IconTrendingUp = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
);
const IconBox = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
);
const IconShield = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>
);
const IconSword = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" y1="19" x2="19" y2="13" /><line x1="16" y1="16" x2="20" y2="20" /><line x1="19" y1="21" x2="20" y2="20" /></svg>
);
const IconShoppingCart = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
);
const IconUser = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const IconHistory = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><polyline points="3 3 3 8 8 8" /><polyline points="12 7 12 12 15 15" /></svg>
);
const IconNavigation = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
);
const IconAlertCircle = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);
const IconBell = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);

function AssetCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="asset-card-wrapper">
      <div className="asset-card-icon">
        {icon}
      </div>
      <div>
        <p className="asset-card-label">{label}</p>
        <p className="asset-card-value">{value}</p>
      </div>
    </div>
  );
}

function NavButton({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <button className="nav-button-wrapper">
        <div className="nav-button-icon">
          {icon}
        </div>
        <span className="nav-button-label">
          {label}
        </span>
      </button>
    </Link>
  );
}
