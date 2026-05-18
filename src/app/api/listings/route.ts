import { NextRequest, NextResponse } from "next/server";
import { searchListings } from "@/lib/listings-db";
import { parseListingSearchParams } from "@/lib/listing-search";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const listings = await searchListings(parseListingSearchParams(params));
  return NextResponse.json({ listings });
}
