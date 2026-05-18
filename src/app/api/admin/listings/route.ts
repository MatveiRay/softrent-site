import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createAdminListing,
  isAdminEmail,
  listAdminListings,
  updateAdminListing,
} from "@/lib/admin-service";

async function ensureAdmin() {
  const session = await auth();
  return isAdminEmail(session?.user?.email) ? session : null;
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ listings: await listAdminListings() });
}

export async function POST(req: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const listing = await createAdminListing({
    slug: String(body.slug),
    title: String(body.title),
    description: String(body.description ?? ""),
    location: String(body.location),
    country: String(body.country),
    category: body.category === "MOUNTAIN" ? "MOUNTAIN" : "TROPICAL",
    price: Number(body.price) || 0,
    guests: Number(body.guests) || 2,
  });
  return NextResponse.json({ listing }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const listing = await updateAdminListing(String(body.id), {
    ...(typeof body.title === "string" ? { title: body.title } : {}),
    ...(typeof body.description === "string"
      ? { description: body.description }
      : {}),
    ...(typeof body.location === "string" ? { location: body.location } : {}),
    ...(typeof body.country === "string" ? { country: body.country } : {}),
    ...(body.category === "TROPICAL" || body.category === "MOUNTAIN"
      ? { category: body.category }
      : {}),
    ...(typeof body.price === "number" ? { price: body.price } : {}),
    ...(typeof body.guests === "number" ? { guests: body.guests } : {}),
    ...(typeof body.isPublished === "boolean"
      ? { isPublished: body.isPublished }
      : {}),
  });
  return NextResponse.json({ listing });
}
