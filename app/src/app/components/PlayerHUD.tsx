"use client";

import { useI18n } from "../../i18n";
import { usePlayerProfile } from "../../wallet/usePlayerProfile";

export function PlayerHUD() {
  const player = usePlayerProfile();
  const { t } = useI18n();

  const armorPct = Math.min(player.armorPointBalance, 100);
  const weaponPct = Math.min(player.weaponPointBalance, 100);
  const corePct = 42;

  return (
    <div className="panel" style={{ position: "relative" }}>
      <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{t.dashboard.playerHUD}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "var(--accent)", fontSize: "12px" }}>{t.dashboard.activeStatus.toUpperCase()}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0" }}>
        <div
          style={{
            alignSelf: "center",
            width: "160px",
            height: "200px",
            background: "linear-gradient(to bottom, rgba(120, 214, 107, 0.1), transparent)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: "32px",
            overflow: "hidden",
          }}
        >
          <img
            src="/hero.png"
            alt="Character Preview"
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))" }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-16px",
              width: "120px",
              height: "16px",
              background: "rgba(120, 214, 107, 0.3)",
              filter: "blur(15px)",
              borderRadius: "50%",
            }}
          />
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
          <StatBar label={t.dashboard.armorIntegrity} current={player.armorPointBalance} max={100} color="var(--accent)" pct={armorPct} />
          <StatBar label={t.dashboard.weaponCharge} current={player.weaponPointBalance} max={100} color="#f59e0b" pct={weaponPct} />
          {/* <StatBar label={t.dashboard.neuralSync} current={corePct} max={100} color="#06b6d4" pct={corePct} /> */}
        </div>
      </div>

      <div style={{ marginTop: "16px", padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", fontSize: "0.8rem", border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
          <span>{t.dashboard.inventoryLabel}</span>
          <span style={{ color: "var(--accent)" }}>140 / 100</span>
        </div>
      </div>
    </div>
  );
}

function StatBar({
  label,
  current,
  max,
  color,
  pct,
}: {
  label: string;
  current: number;
  max: number;
  color: string;
  pct: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>
        <span style={{ color: "var(--muted)" }}>
          {label}: {current.toFixed(1)} / {max}
        </span>
        <span style={{ color: "white", fontFamily: "monospace" }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: "8px", background: "rgba(0,0,0,0.6)", borderRadius: "999px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", padding: "2px" }}>
        <div style={{ height: "100%", borderRadius: "999px", background: color, width: `${pct}%`, transition: "width 1s ease-out", boxShadow: "0 0 10px rgba(255,255,255,0.1)" }} />
      </div>
    </div>
  );
}
