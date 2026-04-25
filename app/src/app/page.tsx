"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PublicKey } from "@solana/web3.js";

import { EdcoinsConversionPanel } from "../components/EdcoinsConversionPanel";
import { LanguageToggle } from "../components/LanguageToggle";
import { PlayerCharacter } from "../components/PlayerCharacter";
import { WalletRejectedState } from "../components/StateViews";
import { translateWalletError, useI18n } from "../i18n";
import { usePlayerProfile } from "../wallet/usePlayerProfile";

const actions = [
  { href: "/play", key: "play" },
  { href: "/marketplace", key: "marketplace" },
  { href: "/warehouse", key: "warehouse" },
  { href: "/records", key: "records" },
] as const;

export default function PlayerHomePage() {
  const player = usePlayerProfile();
  const { language, t } = useI18n();
  const walletError = useMemo(() => translateWalletError(player.walletError, language), [player.walletError, language]);
  const playerProfilePda = useMemo(() => {
    if (!player.walletAddress) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from("player"), new PublicKey(player.walletAddress).toBuffer()],
      new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ"),
    )[0].toBase58();
  }, [player.walletAddress]);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1>Escape from Delta</h1>
        </div>
        <div className="toolbar">
          <LanguageToggle />
          {player.connected ? (
            <button className="button" type="button" onClick={player.disconnect} title={player.walletAddress ?? undefined}>
              {t.wallet.disconnect}
            </button>
          ) : (
            <button
              className="button"
              type="button"
              onClick={player.connectDemoWallet}
              disabled={player.connecting}
              title={player.connecting ? t.wallet.connectingTitle : t.wallet.connectTitle}
            >
              {player.connecting ? t.wallet.connecting : t.wallet.connect}
            </button>
          )}
        </div>
      </header>

      {player.conversionError ? <WalletRejectedState label={t.wallet.rejected} /> : null}
      {walletError ? (
        <p className="alert" role="alert">
          {walletError}
        </p>
      ) : null}

      <section className="dashboard">
        <div className="hero-copy">
          <div>
            <p>{t.home.hero}</p>
            <nav className="action-grid" aria-label={t.home.mainActions}>
              {actions.map((action) => (
                <Link className="button" href={action.href} key={action.href}>
                  {t.nav[action.key]}
                </Link>
              ))}
            </nav>
          </div>

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

          {playerProfilePda ? (
            <div className="inventory-item">
              <div>
                <span className="stat-label">{t.common.playerProfilePda}</span>
                <strong>{playerProfilePda}</strong>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => void navigator.clipboard.writeText(playerProfilePda)}
              >
                {t.common.copy}
              </button>
            </div>
          ) : null}
        </div>

        <div className="scene" aria-label={t.home.sceneLabel}>
          <div className="scene-ground" />
          <div className="scene-crates" aria-hidden="true">
            <div className="crate" />
            <div className="crate" />
            <div className="crate" />
            <div className="crate" />
          </div>
          <PlayerCharacter
            armorPointBalance={player.armorPointBalance}
            weaponPointBalance={player.weaponPointBalance}
            armorLabel={t.common.armor}
            weaponLabel={t.common.weapon}
            characterLabel={t.common.characterLabel}
          />
        </div>
      </section>

      <EdcoinsConversionPanel
        title={t.conversion.title}
        ariaLabel={t.conversion.aria}
        description={t.conversion.description}
        buttonLabel={t.conversion.button}
      />

      {player.connected && !player.onChainProfile ? (
        <details>
          <summary>Profile Debug</summary>
          <pre>
            {JSON.stringify(
              {
                walletAddress: player.walletAddress,
                onChainProfileLoaded: player.onChainProfileLoaded,
                onChainActiveRaid: player.onChainActiveRaid,
                lastTransactionDebug: player.lastTransactionDebug,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}
    </main>
  );
}
