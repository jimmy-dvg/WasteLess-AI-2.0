import { NextResponse } from "next/server";
import { parseReceiptText } from "@/ai-parsing/receipt-parser";
import { requireUser } from "@/lib/auth";
import {
  createScanHistoryEntry,
  createScannedReceipt,
} from "@/scanning/scan-history.service";
import { ocrParseRequestSchema } from "@/scanning/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json().catch(() => null);
  const parsed = ocrParseRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid OCR text" },
      { status: 400 }
    );
  }

  try {
    const parsedReceipt = await parseReceiptText(parsed.data.rawText);
    const receipt = await createScannedReceipt(user.id, {
      imageUrl: parsed.data.imageUrl ?? null,
      rawText: parsed.data.rawText,
      extractedData: parsedReceipt,
      status: parsedReceipt.items.length > 0 ? "processed" : "partial",
    });

    await createScanHistoryEntry(user.id, {
      type: "receipt",
      rawText: parsed.data.rawText,
      status: parsedReceipt.items.length > 0 ? "processed" : "partial",
      metadata: {
        receiptId: receipt?.id ?? null,
        itemCount: parsedReceipt.items.length,
        warnings: parsedReceipt.warnings,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        receiptId: receipt?.id ?? null,
        parsedReceipt,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to parse receipt text" }, { status: 500 });
  }
}
