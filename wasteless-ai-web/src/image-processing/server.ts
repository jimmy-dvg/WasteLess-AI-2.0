import "server-only";

import {
  MAX_RECEIPT_IMAGE_BYTES,
  SUPPORTED_RECEIPT_IMAGE_TYPES,
} from "@/scanning/validation";

export type ValidatedImageFile = {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  size: number;
};

export async function validateScanImageFile(
  file: File | null,
  label = "Image"
): Promise<ValidatedImageFile> {
  if (!file) {
    throw new Error(`${label} is required`);
  }

  if (!SUPPORTED_RECEIPT_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_RECEIPT_IMAGE_TYPES)[number])) {
    throw new Error("Upload a JPEG, PNG, or WebP image");
  }

  if (file.size > MAX_RECEIPT_IMAGE_BYTES) {
    throw new Error("Receipt image must be 8 MB or smaller");
  }

  if (file.size <= 0) {
    throw new Error("Receipt image is empty");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    fileName: file.name || "receipt.jpg",
    contentType: file.type,
    size: file.size,
  };
}

export async function validateReceiptImageFile(file: File | null): Promise<ValidatedImageFile> {
  return validateScanImageFile(file, "Receipt image");
}
