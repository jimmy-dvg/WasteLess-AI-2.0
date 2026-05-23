import { NextResponse } from "next/server";
import { recognizeFoodFromImage } from "@/ai-parsing/photo-recognition";
import { validateScanImageFile } from "@/image-processing/server";
import { requireApiUser } from "@/lib/auth";
import { createScanHistoryEntry } from "@/scanning/scan-history.service";
import { photoScanModeSchema } from "@/scanning/validation";
import { uploadReceiptImage } from "@/storage/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;
  const { user } = auth;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("image");
  const modeValue = formData?.get("mode");
  const mode = photoScanModeSchema.safeParse(typeof modeValue === "string" ? modeValue : "food_photo");

  if (!mode.success) {
    return NextResponse.json({ success: false, error: "Unsupported photo scan mode" }, { status: 400 });
  }

  try {
    const image = await validateScanImageFile(file instanceof File ? file : null, "Food photo");
    const [upload, parsedReceipt] = await Promise.all([
      uploadReceiptImage(image.buffer, image.fileName, image.contentType),
      recognizeFoodFromImage(image.buffer, image.contentType, mode.data),
    ]);

    await createScanHistoryEntry(user.id, {
      type: mode.data,
      status: parsedReceipt.items.length > 0 ? "processed" : "partial",
      metadata: {
        imageUrl: upload.url,
        storageProvider: upload.provider,
        storageWarning: upload.warning ?? null,
        itemCount: parsedReceipt.items.length,
        warnings: parsedReceipt.warnings,
      },
    });

    const warnings = parsedReceipt.warnings;

    return NextResponse.json({
      success: true,
      data: {
        mode: mode.data,
        imageUrl: upload.url,
        warnings,
        parsedReceipt: {
          ...parsedReceipt,
          warnings,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze food photo";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
