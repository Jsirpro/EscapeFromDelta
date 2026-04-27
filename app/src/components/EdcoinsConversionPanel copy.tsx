import { useState } from "react";
import { SOL_TO_EDCOINS_RATE } from "../../../clients/src/types";
import { usePlayerProfile } from "../wallet/usePlayerProfile";
import { useI18n } from "../i18n";

const ONE_SOL_LAMPORTS = 1_000_000_000n;

export function EdcoinsConversionPanel() {
  const player = usePlayerProfile();
  const { t } = useI18n();
  const [solAmount, setSolAmount] = useState("1");
  
  const parsedSol = parseFloat(solAmount) || 0;
  const previewEdcoins = Math.floor(parsedSol * Number(SOL_TO_EDCOINS_RATE));

  const handleConvert = () => {
    const lamports = BigInt(Math.floor(parsedSol * Number(ONE_SOL_LAMPORTS)));
    void player.convertDemoSol(lamports);
  };

  return (
    <div className="dashboard-panel">
      <h3 className="dashboard-panel-header">{t.dashboard.assetExchange}</h3>
      <div className="exchange-box">
          <div className="exchange-rate">
              <span>SOL → {t.common.edcoins}</span>
              <span>1 SOL = {(Number(SOL_TO_EDCOINS_RATE)/1000000).toFixed(0)}M {t.common.edcoins}</span>
          </div>
          <div className="exchange-input-container">
              <input
                  type="number"
                  value={solAmount}
                  onChange={(e) => setSolAmount(e.target.value)}
                  className="exchange-input"
              />
              <span className="exchange-input-suffix">SOL</span>
          </div>
          <div className="exchange-refresh">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          </div>
          <div className="exchange-preview">
              <p className="title">{t.dashboard.preview}</p>
              <p className="value">{previewEdcoins.toLocaleString()}</p>
              <p className="subtitle">{t.common.edcoins}</p>
          </div>
          <button 
            className="btn-convert"
            disabled={!player.connected || parsedSol <= 0}
            onClick={handleConvert}
          >
            {t.dashboard.convertAssets}
          </button>
      </div>
    </div>
  );
}
