import "server-only";

import crypto from "crypto";
import { storageEnv } from "@/env/server";

export type StoredImage = {
  url: string | null;
  provider: "cloudinary" | "disabled";
  publicId?: string | null;
  warning?: string;
};

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

function getCloudinaryConfig(): CloudinaryConfig | null {
  const env = storageEnv();
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: env.CLOUDINARY_RECEIPT_FOLDER || "wasteless-ai/receipts",
  };
}

function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string) {
  const payload = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function uploadReceiptImage(buffer: Buffer, fileName: string, contentType: string): Promise<StoredImage> {
  const config = getCloudinaryConfig();

  if (!config) {
    return {
      url: null,
      provider: "disabled",
      warning: "Cloudinary storage is not configured. The scan can continue, but the image will not be persisted.",
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  const signedParams = {
    folder: config.folder,
    public_id: `${publicId || "receipt"}-${timestamp}`,
    timestamp,
  };

  const signature = signCloudinaryParams(signedParams, config.apiSecret);
  const formData = new FormData();
  formData.set("file", new Blob([new Uint8Array(buffer)], { type: contentType }));
  formData.set("api_key", config.apiKey);
  formData.set("folder", signedParams.folder);
  formData.set("public_id", signedParams.public_id);
  formData.set("timestamp", String(timestamp));
  formData.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed with status ${response.status}`);
  }

  const data = (await response.json()) as { secure_url?: string; public_id?: string };

  if (!data.secure_url) {
    throw new Error("Cloudinary upload response did not include a secure URL");
  }

  return {
    url: data.secure_url,
    provider: "cloudinary",
    publicId: data.public_id ?? signedParams.public_id,
  };
}
