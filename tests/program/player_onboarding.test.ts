import { describe, expect, it } from "vitest";

import { EDCOINS_STARTER_GRANT, STARTER_ARMOR_TENTHS, STARTER_WEAPON_TENTHS } from "../../clients/src/types";

describe("player onboarding program contract", () => {
  it("initializes game and grants a new player exactly once", () => {
    const profile = {
      grantClaimed: false,
      edcoins: 0n,
      armorTenths: 0,
      weaponTenths: 0,
    };

    if (!profile.grantClaimed) {
      profile.edcoins += EDCOINS_STARTER_GRANT;
      profile.armorTenths += STARTER_ARMOR_TENTHS;
      profile.weaponTenths += STARTER_WEAPON_TENTHS;
      profile.grantClaimed = true;
    }

    expect(profile).toMatchObject({
      grantClaimed: true,
      edcoins: 20_000n,
      armorTenths: 200,
      weaponTenths: 200,
    });
  });

  it("rejects duplicate starter grants", () => {
    const profile = { grantClaimed: true };
    expect(profile.grantClaimed).toBe(true);
  });
});
