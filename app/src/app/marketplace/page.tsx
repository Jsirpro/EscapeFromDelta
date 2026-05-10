"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { LanguageToggle } from "../../components/LanguageToggle";
import { ListingForm } from "../../components/ListingForm";
import { MarketplaceListings } from "../../components/MarketplaceListings";
import { useI18n } from "../../i18n";

export default function MarketplacePage() {
  const { t } = useI18n();
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
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                }}
              >
                {t.marketplace.eyebrow}
              </p>
              <h1 style={{ margin: 0, fontSize: "3.6rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95 }}>
                {t.marketplace.title}
              </h1>
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

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.35fr) minmax(340px, 0.65fr)",
            gap: 24,
            alignItems: "start",
          }}
        >
          <Panel title={t.marketplace.activeListings} icon={<IconTag size={16} style={{ color: "#10b981" }} />}>
            <MarketplaceListings />
          </Panel>

          <Panel title={t.marketplace.newListing} icon={<IconPlus size={16} style={{ color: "#10b981" }} />}>
            <ListingForm />
          </Panel>
        </section>
      </main>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section
      style={{
        borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.22)",
        padding: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 22,
          color: "#94a3b8",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontSize: 13,
        }}
      >
        {icon}
        <span>{title}</span>
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 24 }} />
      {children}
    </section>
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

function IconTag({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function IconPlus({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
