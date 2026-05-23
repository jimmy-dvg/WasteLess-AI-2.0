import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getScannerDiagnostics } from "@/scanning/diagnostics";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  return NextResponse.json({ success: true, data: getScannerDiagnostics() });
}
