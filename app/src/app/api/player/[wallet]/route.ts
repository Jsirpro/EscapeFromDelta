import { NextResponse } from "next/server";

import { fetchPlayerProfileByWallet } from "../../../../../../clients/src/queries/localnet";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "11111111111111111111111111111111";

export async function GET(_request: Request, context: { params: { wallet: string } }) {
  try {
    const result = await fetchPlayerProfileByWallet(context.params.wallet, PROGRAM_ID);
    return NextResponse.json({
      profile: result
        ? {
            ...result.profile,
            edcoinsBalance: result.profile.edcoinsBalance.toString(),
            warehouseNonce: result.profile.warehouseNonce.toString(),
            nextRaidId: result.profile.nextRaidId.toString(),
          }
        : null,
      address: result?.address ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { profile: null, address: null, error: error instanceof Error ? error.message : "unknown-error" },
      { status: 200 },
    );
  }
}
