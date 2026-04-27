"use client";

import { usePlayerProfile } from "../../wallet/usePlayerProfile";
import { useI18n } from "../../i18n";

export function BattleRecords() {
  const player = usePlayerProfile();
  const { t } = useI18n();
  
  // Use real records if available, otherwise mock some
  const records = player.battleRecords?.length 
    ? player.battleRecords.slice(0, 5)
    : [
        { id: "1", type: "RAID FEED", message: t.languageButton === "English" ? "玩家 Alpha 携带稀有武器成功撤离。" : "Player Alpha extracted with rare weapon." },
        { id: "2", type: "EVENT", message: t.languageButton === "English" ? "4号区域刷新了新的补给箱。" : "New containers spawned in Zone 4." },
        { id: "3", type: "ALERT", message: t.languageButton === "English" ? "Delta 北部辐射水平上升。" : "Radiation level increasing in Delta North." },
      ];

  return (
    <div className="dashboard-panel" style={{ display: "flex", flexDirection: "column", height: "360px" }}>
      <h3 className="dashboard-panel-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {t.dashboard.battleRecords}
      </h3>
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }} className="custom-scrollbar">
        {player.battleRecords?.length === 0 && (
           <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
             {t.dashboard.noRecords}
           </div>
        )}
        {records.map((r, i) => (
          <div key={r.id || i} style={{ 
            fontSize: "11px", lineHeight: 1.6, borderLeft: "2px solid rgba(255,255,255,0.05)", 
            paddingLeft: "12px", paddingBottom: "4px", paddingTop: "4px", marginBottom: "8px" 
          }}>
            <span style={{ 
              fontWeight: "bold", marginRight: "8px", 
              color: ('type' in r && r.type === 'RAID FEED') ? "#34d399" : 
                     ('type' in r && r.type === 'EVENT') ? "#22d3ee" : "#64748b"
            }}>
              [{'type' in r ? r.type : "RAID"}]
            </span>
            <span style={{ color: "#94a3b8" }}>
              {'message' in r ? r.message : `Raid settled: ${r.result}`}
            </span>
            <p style={{ fontSize: "9px", color: "#475569", marginTop: "4px", fontFamily: "monospace", textTransform: "uppercase", margin: "4px 0 0 0" }}>2 MINS AGO</p>
          </div>
        ))}
      </div>
    </div>
  );
}
