import { describe, expect, it } from "vitest";

import { groupWarehouseAssets } from "../src/queries/warehouse";
import { armorAssetFixture, weaponAssetFixture } from "../../tests/fixtures/game-fixtures";

describe("warehouse query", () => {
  it("groups assets and preserves malformed handling boundary", () => {
    const grouped = groupWarehouseAssets([armorAssetFixture, weaponAssetFixture]);
    expect(grouped.armor_points).toHaveLength(1);
    expect(grouped.weapon_points).toHaveLength(1);
  });
});
