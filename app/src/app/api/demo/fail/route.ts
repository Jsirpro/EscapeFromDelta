import { NextResponse } from "next/server";

import { settleLocalDemoRaid } from "../../../../lib/local-demo";

export async function POST() {
  try {
    return NextResponse.json(await settleLocalDemoRaid("failed"));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
