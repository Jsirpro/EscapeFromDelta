import { NextResponse } from "next/server";

import { buildPurchaseLoadoutPointsTransaction } from "../../../../lib/local-demo";

export async function POST(request: Request) {
  const payload = (await request.json()) as { player?: string; kind?: "armor" | "weapon" };
  if (!payload.player) {
    return NextResponse.json({ error: "missing-player" }, { status: 400 });
  }
  if (payload.kind !== "armor" && payload.kind !== "weapon") {
    return NextResponse.json({ error: "missing-kind" }, { status: 400 });
  }
  try {
    return NextResponse.json(await buildPurchaseLoadoutPointsTransaction(payload.player, payload.kind));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
