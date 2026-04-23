export type CharacterTier = "none" | "light" | "medium" | "heavy";

export function getCharacterTier(armorPointBalance: number, weaponPointBalance: number): CharacterTier {
  const total = armorPointBalance + weaponPointBalance;
  if (total <= 0) return "none";
  if (total < 10) return "light";
  if (total < 30) return "medium";
  return "heavy";
}

export function PlayerCharacter({
  armorPointBalance,
  weaponPointBalance,
  armorLabel = "Armor",
  weaponLabel = "Weapon",
  characterLabel = "character equipment tier",
}: {
  armorPointBalance: number;
  weaponPointBalance: number;
  armorLabel?: string;
  weaponLabel?: string;
  characterLabel?: string;
}) {
  const tier = getCharacterTier(armorPointBalance, weaponPointBalance);
  return (
    <div className={`character character-${tier}`} aria-label={`${characterLabel} ${tier}`}>
      <div className="character-model" aria-hidden="true">
        <div className="character-head" />
        <div className="character-body" />
        <div className="character-legs" />
        <div className="character-weapon" />
      </div>
      <p className="character-caption">
        {armorLabel} {armorPointBalance.toFixed(1)} / {weaponLabel} {weaponPointBalance.toFixed(1)}
      </p>
    </div>
  );
}
