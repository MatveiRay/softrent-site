import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  isAdminEmail,
  listAvailabilityBlocks,
} from "@/lib/admin-service";

async function ensureAdmin() {
  const session = await auth();
  return isAdminEmail(session?.user?.email) ? session : null;
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ blocks: await listAvailabilityBlocks() });
}

export async function POST(req: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const startDate = new Date(String(body.startDate));
  const endDate = new Date(String(body.endDate));
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate
  ) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }
  const block = await createAvailabilityBlock({
    listingId: String(body.listingId),
    startDate,
    endDate,
    reason: body.reason ? String(body.reason) : undefined,
  });
  return NextResponse.json({ block }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await deleteAvailabilityBlock(id);
  return NextResponse.json({ ok: true });
}
