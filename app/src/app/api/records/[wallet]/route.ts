import { NextResponse } from "next/server";

import { fetchBattleRecordsByWallet } from "../../../../../../clients/src/queries/localnet";

const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ";

export async function GET(request: Request, context: { params: { wallet: string } }) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  try {
    const records = await fetchBattleRecordsByWallet(context.params.wallet, PROGRAM_ID, limit);
    return NextResponse.json({ records: records.map((entry) => entry.record) });
  } catch (error) {
    return NextResponse.json(
      { records: [], error: error instanceof Error ? error.message : "unknown-error" },
      { status: 200 },
    );
  }
}
