import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  createScanHistoryEntry,
  importBarcodeProductToInventory,
} from "@/scanning/scan-history.service";
import { importBarcodeProductRequestSchema } from "@/scanning/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json().catch(() => null);
  const parsed = importBarcodeProductRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid product import" },
      { status: 400 }
    );
  }

  try {
    const created = await importBarcodeProductToInventory(user.id, parsed.data);

    if (!created) {
      return NextResponse.json({ success: false, error: "Unable to import product" }, { status: 500 });
    }

    await createScanHistoryEntry(user.id, {
      type: "barcode",
      barcode: parsed.data.barcode,
      status: "processed",
      metadata: {
        importedProductId: created.id,
        product: parsed.data,
      },
    });

    return NextResponse.json({ success: true, data: { productId: created.id } });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to import barcode product" }, { status: 500 });
  }
}
