import { NextResponse } from "next/server";

import { buildCancelListingTransaction } from "../../../../lib/local-demo";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    player?: string;
    listing?: string;
  };
  if (!payload.player) {
    return NextResponse.json({ error: "missing-player" }, { status: 400 });
  }
  if (!payload.listing) {
    return NextResponse.json({ error: "missing-listing" }, { status: 400 });
  }
  try {
    return NextResponse.json(await buildCancelListingTransaction(payload.player, payload.listing));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
