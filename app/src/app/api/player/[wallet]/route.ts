import { NextResponse } from "next/server";

import { fetchPlayerProfileByWallet, fetchRaidSessionByAddress } from "../../../../../../clients/src/queries/localnet";

const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "Ec3cfCCBS14yGkpHGNFTZjbvjFVfCMTfg5zsSECCS6yf";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, context: { params: { wallet: string } }) {
  try {
    const result = await fetchPlayerProfileByWallet(context.params.wallet, PROGRAM_ID);
    const raid = result?.profile.activeRaid ? await fetchRaidSessionByAddress(result.profile.activeRaid) : null;
    return NextResponse.json({
      profile: result
        ? {
            ...result.profile,
            edcoinsBalance: result.profile.edcoinsBalance.toString(),
            warehouseNonce: result.profile.warehouseNonce.toString(),
            nextRaidId: result.profile.nextRaidId.toString(),
          }
        : null,
      raid: raid?.raid ?? null,
      address: result?.address ?? null,
    }, {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { profile: null, raid: null, address: null, error: error instanceof Error ? error.message : "unknown-error" },
      { status: 200, headers: { "cache-control": "no-store, max-age=0" } },
    );
  }
}
