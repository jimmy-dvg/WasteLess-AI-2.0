import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getRecentScanHistory } from "@/scanning/scan-history.service";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;
  const { user } = auth;

  const history = await getRecentScanHistory(user.id, 20);

  return NextResponse.json({ success: true, data: history });
}
