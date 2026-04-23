import { NextResponse } from "next/server";

import { startLocalDemoRaid } from "../../../../lib/local-demo";

export async function POST() {
  try {
    return NextResponse.json(await startLocalDemoRaid());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown-error" },
      { status: 500 },
    );
  }
}
