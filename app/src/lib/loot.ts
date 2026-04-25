"use client";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_INDEXES = new Map(BASE58_ALPHABET.split("").map((char, index) => [char, index]));

export interface LootDisplayItem {
  assetId: string;
  rarity: "rare" | "epic" | "legendary";
  label: string;
}

export function deriveCollectibleDisplay(assetId: string): LootDisplayItem {
  const bytes = decodeBase58(assetId);
  const rarityRoll = ((bytes[0] ?? 0) + (bytes[7] ?? 0) + (bytes[13] ?? 0)) % 100;
  const rarity = rarityRoll < 8 ? "legendary" : rarityRoll < 30 ? "epic" : "rare";
  const poolSize = rarity === "legendary" ? 5 : rarity === "epic" ? 10 : 20;
  const pickSeed = (((bytes[3] ?? 0) << 16) | ((bytes[11] ?? 0) << 8) | (bytes[19] ?? 0)) >>> 0;
  const serial = (pickSeed % poolSize) + 1;
  const labelPrefix =
    rarity === "legendary" ? "Legendary Collectible" : rarity === "epic" ? "Epic Collectible" : "Rare Collectible";
  return {
    assetId,
    rarity,
    label: `${labelPrefix} ${serial}`,
  };
}

function decodeBase58(value: string): Uint8Array {
  let bytes = [0];
  for (const char of value) {
    const digit = BASE58_INDEXES.get(char);
    if (digit === undefined) {
      throw new Error("invalid-base58");
    }
    let carry = digit;
    for (let index = 0; index < bytes.length; index += 1) {
      const next = bytes[index] * 58 + carry;
      bytes[index] = next & 0xff;
      carry = next >> 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of value) {
    if (char !== "1") break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}
