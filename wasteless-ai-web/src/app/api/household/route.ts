import { NextResponse } from "next/server";
import { getHouseholdCollaborationData } from "@/features/household/services/household.service";
import { requireApiUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  try {
    const data = await getHouseholdCollaborationData(auth.user);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Household data is unavailable" }, { status: 500 });
  }
}
