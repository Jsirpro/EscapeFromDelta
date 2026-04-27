import { NextResponse } from "next/server";

import { fetchWarehouseAssetsByWallet } from "../../../../../../clients/src/queries/localnet";

const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, context: { params: { wallet: string } }) {
  try {
    const assets = await fetchWarehouseAssetsByWallet(context.params.wallet, PROGRAM_ID);
    return NextResponse.json(
      { assets: assets.map((entry) => entry.asset) },
      { headers: { "cache-control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return NextResponse.json(
      { assets: [], error: error instanceof Error ? error.message : "unknown-error" },
      { status: 200, headers: { "cache-control": "no-store, max-age=0" } },
    );
  }
}
