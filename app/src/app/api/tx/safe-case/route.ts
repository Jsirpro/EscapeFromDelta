import { NextResponse } from "next/server";

import { buildSessionSelectSafeCaseTransaction } from "../../../../lib/local-demo";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    player?: string;
    sessionSigner?: string;
    sessionToken?: string;
    selectedAssets?: string[];
    capacity?: number;
  };
  if (!payload.player) {
    return NextResponse.json({ error: "missing-player" }, { status: 400 });
  }
  if (!payload.sessionSigner || !payload.sessionToken) {
    return NextResponse.json({ error: "missing-session" }, { status: 400 });
  }
  if (!Array.isArray(payload.selectedAssets)) {
    return NextResponse.json({ error: "missing-selected-assets" }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await buildSessionSelectSafeCaseTransaction(
        payload.player,
        payload.sessionSigner,
        payload.sessionToken,
        payload.selectedAssets,
        payload.capacity ?? 0,
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
