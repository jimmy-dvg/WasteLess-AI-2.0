import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getRecentScanHistory } from "@/scanning/scan-history.service";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  const history = await getRecentScanHistory(user.id, 20);

  return NextResponse.json({ success: true, data: history });
}
