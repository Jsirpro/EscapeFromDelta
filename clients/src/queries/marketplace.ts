import type { WarehouseAsset } from "../types";

export function tradableAssets(assets: WarehouseAsset[]): WarehouseAsset[] {
  return assets.filter((asset) => asset.tradable && asset.lockedState === "available");
}
