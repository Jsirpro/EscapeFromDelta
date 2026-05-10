"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { LanguageToggle } from "../../components/LanguageToggle";
import { RandomAuditDetails } from "../../components/RandomAuditDetails";
import { useI18n } from "../../i18n";
import { usePlayerProfile } from "../../wallet/usePlayerProfile";

export default function RecordsPage() {
  const player = usePlayerProfile();
  const { t } = useI18n();
  const records = player.battleRecords;
  type Record = (typeof records)[number];

  const succeeded = records.filter((r: Record) => r.result === "succeeded").length;
  const failed = records.filter((r: Record) => r.result === "failed").length;
  const timedOut = records.filter((r: Record) => r.result === "timed_out").length;

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
                {t.records.eyebrow}
              </p>
              <h1 style={{ margin: 0, fontSize: "3.6rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95 }}>
                {t.records.title}
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

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, color: "#94a3b8", fontWeight: 800 }}>
          <IconHistory size={18} style={{ color: "#10b981" }} />
          <span>{t.records.title}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18, marginBottom: 28 }}>
          <StatCard label={t.records.results.succeeded.toUpperCase()} value={succeeded} accent />
          <StatCard label={t.records.results.failed.toUpperCase()} value={failed} tone="#ef4444" />
          <StatCard label={t.records.results.timed_out.toUpperCase()} value={timedOut} tone="#f59e0b" />
        </div>

        {records.length === 0 ? (
          <Panel title={t.records.title} icon={<IconHistory size={16} style={{ color: "#10b981" }} />}>
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "#64748b",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              {t.records.empty}
            </div>
          </Panel>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {records.map((record) => (
              <RecordCard
                key={record.recordId}
                raidLabel={`${t.records.raid} #${record.raidId}`}
                resultLabel={t.records.results[record.result]}
                resultKind={record.result}
                retained={record.retainedAssets.length}
                lost={record.lostAssets.length}
                retainedLabel={t.records.retained}
                lostLabel={t.records.lost}
                randomAuditLabel={t.records.randomAudit}
                auditEmpty={t.records.noRandomEvents}
                events={record.randomEvents}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function RecordCard({
  raidLabel,
  resultLabel,
  resultKind,
  retained,
  lost,
  retainedLabel,
  lostLabel,
  randomAuditLabel,
  auditEmpty,
  events,
}: {
  raidLabel: string;
  resultLabel: string;
  resultKind: "succeeded" | "failed" | "timed_out";
  retained: number;
  lost: number;
  retainedLabel: string;
  lostLabel: string;
  randomAuditLabel: string;
  auditEmpty: string;
  events: ReadonlyArray<unknown>;
}) {
  const tone =
    resultKind === "succeeded" ? "#34d399" : resultKind === "failed" ? "#ef4444" : "#f59e0b";
  const toneBg =
    resultKind === "succeeded"
      ? "rgba(16,185,129,0.08)"
      : resultKind === "failed"
        ? "rgba(239,68,68,0.08)"
        : "rgba(245,158,11,0.08)";
  const toneBorder =
    resultKind === "succeeded"
      ? "rgba(16,185,129,0.28)"
      : resultKind === "failed"
        ? "rgba(239,68,68,0.28)"
        : "rgba(245,158,11,0.28)";
  return (
    <section
      style={{
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.22)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <IconHistory size={18} style={{ color: "#10b981" }} />
          <strong style={{ color: "#fff", fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>{raidLabel}</strong>
        </div>
        <span
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: `1px solid ${toneBorder}`,
            background: toneBg,
            color: tone,
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {resultLabel}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        <StatRow label={retainedLabel} value={retained} tone="#34d399" />
        <StatRow label={lostLabel} value={lost} tone="#ef4444" />
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            color: "#94a3b8",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <IconAudit size={14} style={{ color: "#10b981" }} />
          <span>{randomAuditLabel}</span>
        </div>
        {events.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b", fontSize: 13, fontWeight: 700 }}>{auditEmpty}</p>
        ) : (
          <RandomAuditDetails events={events as never} />
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value, accent = false, tone }: { label: string; value: number; accent?: boolean; tone?: string }) {
  const valueColor = tone ?? (accent ? "#34d399" : "#fff");
  const borderColor = accent
    ? "rgba(16,185,129,0.28)"
    : tone
      ? `${tone}44`
      : "rgba(255,255,255,0.08)";
  const labelColor = accent ? "#10b981" : tone ?? "#64748b";
  return (
    <div
      style={{
        minHeight: 120,
        padding: "18px 16px",
        borderRadius: 24,
        border: `1px solid ${borderColor}`,
        background: "rgba(0,0,0,0.24)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        overflow: "hidden",
      }}
    >
      <span style={{ color: labelColor, fontSize: 13, fontWeight: 900, letterSpacing: "0.18em", textAlign: "center" }}>
        {label}
      </span>
      <strong style={{ color: valueColor, fontSize: 44, lineHeight: 1, fontWeight: 900 }}>{value}</strong>
    </div>
  );
}

function StatRow({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em" }}>{label}</span>
      <strong style={{ color: tone, fontSize: 20, fontWeight: 900 }}>{value}</strong>
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, color: "#94a3b8", fontWeight: 800 }}>
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

function IconHistory({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconAudit({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M9 11l3 3 8-8" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
    </svg>
  );
}
