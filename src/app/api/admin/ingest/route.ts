import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail, listIngestRecords } from "@/lib/admin-service";

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ records: await listIngestRecords() });
}
