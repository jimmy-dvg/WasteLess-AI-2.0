import { NextResponse } from "next/server";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { canEditHouseholdInventory } from "@/features/household/constants";
import { getWastePageData, logProductWasteForUser } from "@/features/waste/services/waste.service";
import { requireApiUser } from "@/lib/auth";
import { wasteLogSchema } from "@/validation/waste";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  try {
    const data = await getWastePageData(auth.user.id);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Waste data is unavailable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = wasteLogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Unable to log waste" },
      { status: 400 }
    );
  }

  try {
    const household = await ensurePersonalHouseholdForUser(auth.user);
    if (!canEditHouseholdInventory(household.role)) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to change this household inventory." },
        { status: 403 }
      );
    }

    const result = await logProductWasteForUser({
      userId: auth.user.id,
      householdId: household.id,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      reason: parsed.data.reason,
      notes: parsed.data.notes,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...result,
          message: `${result.quantityLabel} of ${result.productName} logged as waste.`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to log waste right now" },
      { status: 500 }
    );
  }
}
