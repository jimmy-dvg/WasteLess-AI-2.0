import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getRecentImportBatches } from "@/scanning/scan-history.service";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  const batches = await getRecentImportBatches(user.id, 8);

  return NextResponse.json({ success: true, data: batches });
}
