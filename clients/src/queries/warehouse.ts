import type { AssetType, WarehouseAsset } from "../types";

export function groupWarehouseAssets(assets: WarehouseAsset[]): Record<AssetType, WarehouseAsset[]> {
  return {
    collectible: assets.filter((asset) => asset.assetType === "collectible"),
    armor_points: assets.filter((asset) => asset.assetType === "armor_points"),
    weapon_points: assets.filter((asset) => asset.assetType === "weapon_points"),
    safe_case: assets.filter((asset) => asset.assetType === "safe_case"),
  };
}
