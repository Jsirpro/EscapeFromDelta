import { NextResponse } from "next/server";

import { buildCreateListingTransaction } from "../../../../lib/local-demo";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    player?: string;
    warehouseAsset?: string;
    priceEdcoins?: number;
  };
  if (!payload.player) {
    return NextResponse.json({ error: "missing-player" }, { status: 400 });
  }
  if (!payload.warehouseAsset) {
    return NextResponse.json({ error: "missing-warehouse-asset" }, { status: 400 });
  }
  if (!Number.isFinite(payload.priceEdcoins) || (payload.priceEdcoins ?? 0) <= 0) {
    return NextResponse.json({ error: "invalid-price" }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await buildCreateListingTransaction(
        payload.player,
        payload.warehouseAsset,
        Math.trunc(payload.priceEdcoins ?? 0),
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
