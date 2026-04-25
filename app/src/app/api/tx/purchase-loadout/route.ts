import { NextResponse } from "next/server";

import { buildPurchaseLoadoutPointsTransaction } from "../../../../lib/local-demo";

export async function POST(request: Request) {
  const payload = (await request.json()) as { player?: string; kind?: "armor" | "weapon"; amountTenths?: number };
  if (!payload.player) {
    return NextResponse.json({ error: "missing-player" }, { status: 400 });
  }
  if (payload.kind !== "armor" && payload.kind !== "weapon") {
    return NextResponse.json({ error: "missing-kind" }, { status: 400 });
  }
  if (!Number.isFinite(payload.amountTenths) || (payload.amountTenths ?? 0) <= 0) {
    return NextResponse.json({ error: "invalid-amount" }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await buildPurchaseLoadoutPointsTransaction(payload.player, payload.kind, Math.trunc(payload.amountTenths ?? 0)),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
