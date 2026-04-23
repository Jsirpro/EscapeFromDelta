import { NextResponse } from "next/server";

import { buildSettlementTransaction } from "../../../../lib/local-demo";

export async function POST(request: Request) {
  const payload = (await request.json()) as { player?: string };
  if (!payload.player) {
    return NextResponse.json({ error: "missing-player" }, { status: 400 });
  }
  try {
    return NextResponse.json(await buildSettlementTransaction(payload.player, "succeeded"));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
