import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getRecentImportBatches } from "@/scanning/scan-history.service";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;
  const { user } = auth;

  const batches = await getRecentImportBatches(user.id, 8);

  return NextResponse.json({ success: true, data: batches });
}
