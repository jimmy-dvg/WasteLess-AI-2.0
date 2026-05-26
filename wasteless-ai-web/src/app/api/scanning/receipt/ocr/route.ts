import { NextResponse } from "next/server";
import { parseReceiptText } from "@/ai-parsing/receipt-parser";
import { validateReceiptImageFile } from "@/image-processing/server";
import { safeRouteErrorMessage } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { extractTextFromImage } from "@/ocr/ocr.service";
import {
  createScanHistoryEntry,
  createScannedReceipt,
} from "@/scanning/scan-history.service";
import { uploadReceiptImage } from "@/storage/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;
  const { user } = auth;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("image");

  try {
    const image = await validateReceiptImageFile(file instanceof File ? file : null);
    const [upload, ocr] = await Promise.all([
      uploadReceiptImage(image.buffer, image.fileName, image.contentType),
      extractTextFromImage(image.buffer),
    ]);

    if (!ocr.rawText) {
      await createScanHistoryEntry(user.id, {
        type: "receipt",
        status: "failed",
        metadata: {
          upload,
          ocr,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "OCR did not detect readable text. Try a brighter, flatter receipt photo.",
          data: { ocr, upload },
        },
        { status: 422 }
      );
    }

    const parsedReceipt = await parseReceiptText(ocr.rawText);
    const receipt = await createScannedReceipt(user.id, {
      imageUrl: upload.url,
      rawText: ocr.rawText,
      extractedData: parsedReceipt,
      status: parsedReceipt.items.length > 0 ? "processed" : "partial",
    });

    await createScanHistoryEntry(user.id, {
      type: "receipt",
      rawText: ocr.rawText,
      status: parsedReceipt.items.length > 0 ? "processed" : "partial",
      metadata: {
        receiptId: receipt?.id ?? null,
        upload,
        ocrConfidence: ocr.confidence,
        itemCount: parsedReceipt.items.length,
        warnings: [...ocr.warnings, ...parsedReceipt.warnings, upload.warning].filter(Boolean),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        receiptId: receipt?.id ?? null,
        imageUrl: upload.url,
        ocr: {
          ...ocr,
          warnings: [...ocr.warnings, upload.warning].filter((warning): warning is string => Boolean(warning)),
        },
        parsedReceipt,
      },
    });
  } catch (error) {
    console.error("POST /api/scanning/receipt/ocr failed", error);
    return NextResponse.json(
      { success: false, error: safeRouteErrorMessage(error, "Receipt OCR failed") },
      { status: 400 }
    );
  }
}
