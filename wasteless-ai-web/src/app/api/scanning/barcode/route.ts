import { NextResponse } from "next/server";
import { lookupBarcodeProduct, normalizeBarcode } from "@/barcode/barcode.service";
import { requireUser } from "@/lib/auth";
import { createScanHistoryEntry } from "@/scanning/scan-history.service";
import { barcodeLookupRequestSchema } from "@/scanning/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json().catch(() => null);
  const parsed = barcodeLookupRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid barcode request" },
      { status: 400 }
    );
  }

  try {
    const barcode = normalizeBarcode(parsed.data.barcode);
    const result = await lookupBarcodeProduct(user.id, barcode);

    await createScanHistoryEntry(user.id, {
      type: "barcode",
      barcode,
      symbology: parsed.data.format ?? null,
      status: result.found ? "processed" : "partial",
      metadata: {
        found: result.found,
        providersTried: result.providersTried,
        warnings: result.warnings,
        product: result.product,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, error: "Barcode lookup failed" }, { status: 500 });
  }
}
