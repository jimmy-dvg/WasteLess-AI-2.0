import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/features/auth/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  clearSessionCookie(response);

  return response;
}
