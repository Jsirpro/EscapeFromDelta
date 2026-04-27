"use client";

import { useMemo } from "react";
import { useI18n } from "../../i18n";

export function RaidFeedMap() {
  const { t } = useI18n();

  // Fixed seed markers for consistent rendering
  const enemyMarkers = useMemo(() => [
    { id: 1, x: 530, y: 185, label: "BUFFER_ZON" },
    { id: 2, x: 310, y: 340, label: "EXTRACT" },
  ], []);

  return (
    <div
      style={{
        background: "#000",
        border: "1px solid rgba(52, 211, 153, 0.2)",
        borderRadius: "8px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Map Header */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        {/* Sector Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            padding: "7px 14px",
            border: "1px solid rgba(52, 211, 153, 0.25)",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 6px #ef4444",
              animation: "pulse 1.2s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 900,
                textTransform: "uppercase",
                margin: 0,
                color: "#e2e8f0",
                letterSpacing: "0.08em",
              }}
            >
              <span style={{ color: "#ef4444" }}>■</span>{" "}
              {(t.dashboard.sector || "SECTOR")}: DELTA-09
            </p>
            <p
              style={{
                fontSize: "9px",
                color: "var(--accent)",
                textTransform: "uppercase",
                margin: 0,
                letterSpacing: "0.12em",
                marginTop: 1,
              }}
            >
              {t.dashboard.liveRaidFeed}
            </p>
          </div>
        </div>

        {/* Coords */}
        <div
          style={{
            textAlign: "right",
            fontFamily: "monospace",
            fontSize: "10px",
            color: "rgba(52, 211, 153, 0.5)",
            lineHeight: 1.6,
          }}
        >
          LAT: 30.0522° N<br />
          LON: 118.2437° W
        </div>
      </div>

      {/* SVG Tactical Map */}
      <div style={{ aspectRatio: "16/10", position: "relative" }}>
        {/* Background grid */}
        <svg
          viewBox="0 0 800 500"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid lines */}
          {Array.from({ length: 17 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 50}
              y1={0}
              x2={i * 50}
              y2={500}
              stroke="rgba(52,211,153,0.07)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 50}
              x2={800}
              y2={i * 50}
              stroke="rgba(52,211,153,0.07)"
              strokeWidth="1"
            />
          ))}

          {/* Cross-hair lines */}
          <line x1="0" y1="250" x2="800" y2="250" stroke="rgba(52,211,153,0.12)" strokeWidth="0.8" strokeDasharray="6 6" />
          <line x1="400" y1="0" x2="400" y2="500" stroke="rgba(52,211,153,0.12)" strokeWidth="0.8" strokeDasharray="6 6" />

          {/* ── Zone shapes ── */}

          {/* Top-left building */}
          <rect x="95" y="80" width="145" height="115" rx="4"
            fill="none" stroke="rgba(52,211,153,0.35)" strokeWidth="1.5" />
          {/* inner detail */}
          <rect x="105" y="90" width="50" height="40" rx="2"
            fill="rgba(52,211,153,0.04)" stroke="rgba(52,211,153,0.2)" strokeWidth="1" />

          {/* Top-right building */}
          <rect x="555" y="65" width="155" height="155" rx="4"
            fill="none" stroke="rgba(52,211,153,0.35)" strokeWidth="1.5" />
          <rect x="570" y="80" width="50" height="40" rx="2"
            fill="rgba(52,211,153,0.04)" stroke="rgba(52,211,153,0.2)" strokeWidth="1" />

          {/* Center CORE_LAB octagon */}
          <path
            d="M350 155 L450 155 L490 195 L490 330 L450 370 L350 370 L310 330 L310 195 Z"
            fill="rgba(52,211,153,0.04)"
            stroke="rgba(52,211,153,0.5)"
            strokeWidth="1.8"
          />
          <text x="370" y="268" fill="rgba(52,211,153,0.7)" fontSize="11" fontWeight="bold" fontFamily="monospace">CORE_LAB</text>

          {/* Danger zone (bottom-left circle) */}
          <circle cx="155" cy="395" r="65"
            fill="rgba(239,68,68,0.06)"
            stroke="rgba(239,68,68,0.4)"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
          <text x="118" y="430" fill="rgba(239,68,68,0.6)" fontSize="9" fontFamily="monospace" fontWeight="bold">HAZARD_ZN</text>

          {/* Connector paths */}
          <path d="M240 140 L310 195" stroke="rgba(52,211,153,0.3)" strokeWidth="1.2" strokeDasharray="5 4" fill="none" />
          <path d="M490 200 L555 130" stroke="rgba(52,211,153,0.3)" strokeWidth="1.2" strokeDasharray="5 4" fill="none" />
          <path d="M400 370 L400 470 L100 470" stroke="rgba(52,211,153,0.25)" strokeWidth="1.2" strokeDasharray="5 4" fill="none" />
          <path d="M310 290 L155 380" stroke="rgba(239,68,68,0.25)" strokeWidth="1" strokeDasharray="4 4" fill="none" />

          {/* ── Enemy player marker (red triangle) ── */}
          {enemyMarkers.map((m) => (
            <g key={m.id} transform={`translate(${m.x}, ${m.y})`}>
              <polygon
                points="0,-9 8,6 -8,6"
                fill="#ef4444"
                opacity="0.9"
              />
              {/* pulse ring */}
              <circle r="14" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.3">
                <animate attributeName="r" from="10" to="18" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
              <text
                y="-14"
                textAnchor="middle"
                fill="#ef4444"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {m.label}
              </text>
            </g>
          ))}

          {/* ── YOU marker (green dot) ── */}
          <g transform="translate(400, 240)">
            <circle r="14" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.4)" strokeWidth="1">
              <animate attributeName="r" from="10" to="20" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="5" fill="rgba(52,211,153,1)" />
            <text
              y="-12"
              textAnchor="middle"
              fill="rgba(52,211,153,0.9)"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {(t.common.you || "YOU").toUpperCase()}
            </text>
          </g>

          {/* Scan line animation */}
          <line x1="0" y1="0" x2="800" y2="0" stroke="rgba(52,211,153,0.18)" strokeWidth="2">
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0,0"
              to="0,500"
              dur="5s"
              repeatCount="indefinite"
            />
          </line>
        </svg>
      </div>

      {/* Bottom HUD */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          right: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 7,
                height: 7,
                background: "#34d399",
                borderRadius: "50%",
                boxShadow: "0 0 4px #34d399",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                color: "#e2e8f0",
                fontWeight: "bold",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
              }}
            >
              {t.dashboard.signalStrength.toUpperCase()}: 98%
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 7,
                height: 7,
                background: "#f59e0b",
                borderRadius: "50%",
                boxShadow: "0 0 4px #f59e0b",
                animation: "pulse 1.4s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                color: "#e2e8f0",
                fontWeight: "bold",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
              }}
            >
              {t.dashboard.onChainValidation.toUpperCase()}:{" "}
              {(t.dashboard.activeStatus || "ACTIVE").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Terminal badge */}
        <div
          style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            padding: "5px 12px",
            borderRadius: "4px",
            border: "1px solid rgba(52,211,153,0.2)",
            fontSize: "9px",
            fontFamily: "monospace",
            color: "rgba(52, 211, 153, 0.65)",
            letterSpacing: "0.06em",
          }}
        >
          {t.dashboard.terminal?.toUpperCase() || "TERMINAL"} 0xDF...A21
        </div>
      </div>
    </div>
  );
}
