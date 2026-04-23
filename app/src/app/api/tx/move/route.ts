import { NextResponse } from "next/server";

import { buildMoveAreaTransaction } from "../../../../lib/local-demo";

const RISK_AREAS = new Set(["low", "medium", "high"]);

export async function POST(request: Request) {
  const payload = (await request.json()) as { player?: string; area?: string };
  if (!payload.player) {
    return NextResponse.json({ error: "missing-player" }, { status: 400 });
  }
  if (!payload.area || !RISK_AREAS.has(payload.area)) {
    return NextResponse.json({ error: "invalid-area" }, { status: 400 });
  }
  try {
    return NextResponse.json(await buildMoveAreaTransaction(payload.player, payload.area as "low" | "medium" | "high"));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
