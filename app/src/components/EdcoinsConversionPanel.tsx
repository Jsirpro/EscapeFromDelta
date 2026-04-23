import { SOL_TO_EDCOINS_RATE } from "../../../clients/src/types";
import { usePlayerProfile } from "../wallet/usePlayerProfile";

export function previewEdcoinsCredit(solAmount: bigint): bigint {
  if (solAmount <= 0n) return 0n;
  return solAmount * SOL_TO_EDCOINS_RATE;
}

export function EdcoinsConversionPanel({
  title = "EDcoins",
  description,
  buttonLabel = "Convert SOL",
  ariaLabel = "SOL to EDcoins conversion",
}: {
  title?: string;
  description?: string;
  buttonLabel?: string;
  ariaLabel?: string;
}) {
  const player = usePlayerProfile();
  const preview = previewEdcoinsCredit(1n);
  return (
    <section className="control-surface" aria-label={ariaLabel}>
      <h2>{title}</h2>
      <p>{description ?? `1 SOL credits ${preview.toString()} EDcoins.`}</p>
      <button
        className="button"
        type="button"
        disabled={!player.connected}
        onClick={() => player.convertDemoSol(1n)}
      >
        {buttonLabel}
      </button>
    </section>
  );
}
