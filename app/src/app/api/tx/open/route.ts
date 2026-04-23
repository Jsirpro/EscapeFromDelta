import { NextResponse } from "next/server";

import { buildOpenContainerTransaction } from "../../../../lib/local-demo";

export async function POST(request: Request) {
  const payload = (await request.json()) as { player?: string; containerIndex?: number; finalRandomValue?: number };
  if (!payload.player) {
    return NextResponse.json({ error: "missing-player" }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await buildOpenContainerTransaction(payload.player, payload.containerIndex ?? 0, payload.finalRandomValue ?? 5),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
