import { NextResponse } from "next/server";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import { canEditHouseholdInventory } from "@/features/household/constants";
import { requireApiUser } from "@/lib/auth";
import {
  createScanHistoryEntry,
  importReceiptItemsToInventory,
} from "@/scanning/scan-history.service";
import { importReceiptItemsRequestSchema } from "@/scanning/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = importReceiptItemsRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid import payload" },
      { status: 400 }
    );
  }

  try {
    const household = await ensurePersonalHouseholdForUser(user);
    if (!canEditHouseholdInventory(household.role)) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to change this household inventory." },
        { status: 403 }
      );
    }

    const importPayload = {
      ...parsed.data,
      items: parsed.data.items.map((item) => ({
        ...item,
        normalizedName: item.normalizedName ?? item.name,
        unit: item.unit ?? null,
        price: item.price ?? null,
        brand: item.brand ?? null,
        category: item.category ?? null,
        shelfLifeDays: item.shelfLifeDays ?? null,
        expirationDate: item.expirationDate ?? null,
        storageLocation: item.storageLocation ?? null,
      })),
    };
    const result = await importReceiptItemsToInventory(user.id, importPayload);

    await createScanHistoryEntry(user.id, {
      type: parsed.data.source === "receipt" ? "receipt" : parsed.data.source,
      status: "processed",
      metadata: {
        receiptId: parsed.data.receiptId ?? null,
        batchId: result.batchId,
        importedCount: result.importedCount,
        skippedCount: result.skippedCount,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to import receipt items";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
