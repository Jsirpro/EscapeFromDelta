import { NextResponse } from "next/server";

import { fetchActiveMarketplaceListings } from "../../../../../clients/src/queries/localnet";

const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const listings = await fetchActiveMarketplaceListings(PROGRAM_ID);
    return NextResponse.json(
      {
        listings: listings.map((entry) => ({
          ...entry.listing,
          asset: entry.asset,
        })),
      },
      { headers: { "cache-control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return NextResponse.json(
      { listings: [], error: error instanceof Error ? error.message : "unknown-error" },
      { status: 200, headers: { "cache-control": "no-store, max-age=0" } },
    );
  }
}
