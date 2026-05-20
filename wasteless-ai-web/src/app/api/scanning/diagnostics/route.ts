import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getScannerDiagnostics } from "@/scanning/diagnostics";

export const runtime = "nodejs";

export async function GET() {
  await requireUser();
  return NextResponse.json({ success: true, data: getScannerDiagnostics() });
}
