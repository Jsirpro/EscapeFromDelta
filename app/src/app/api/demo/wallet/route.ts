import { NextResponse } from "next/server";

import { ensureLocalDemoSetup, getLocalWalletAddress } from "../../../../lib/local-demo";

export async function GET() {
  try {
    await ensureLocalDemoSetup();
    return NextResponse.json({ wallet: await getLocalWalletAddress() });
  } catch (error) {
    return NextResponse.json(
      { wallet: null, error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
