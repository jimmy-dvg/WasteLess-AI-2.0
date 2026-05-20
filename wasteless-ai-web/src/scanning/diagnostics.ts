import "server-only";

import type { ScannerDiagnosticItem, ScannerDiagnostics, ScannerDiagnosticStatus } from "@/scanning/types";

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function hasEnv(key: string) {
  const value = cleanEnv(process.env[key]);
  if (!value) return false;
  const lowered = value.toLowerCase();
  return !["...", "sk-...", "replace_me"].includes(lowered) && !lowered.includes("your_");
}

function item(
  id: string,
  label: string,
  status: ScannerDiagnosticStatus,
  message: string,
  optional = false
): ScannerDiagnosticItem {
  return { id, label, status, message, optional };
}

function configuredItem(id: string, label: string, key: string, optional = false) {
  return hasEnv(key)
    ? item(id, label, "ready", "Configured", optional)
    : item(id, label, optional ? "warning" : "missing", optional ? "Not configured" : "Missing", optional);
}

function getPhotoProvider(): ScannerDiagnostics["photoRecognitionProvider"] {
  const value = cleanEnv(process.env.PHOTO_RECOGNITION_PROVIDER)?.toLowerCase();
  return value === "openai" || value === "gemini" ? value : "auto";
}

function getOverallStatus(items: ScannerDiagnosticItem[]): ScannerDiagnosticStatus {
  const required = items.filter((entry) => !entry.optional);
  if (required.some((entry) => entry.status === "missing")) return "missing";
  if (items.some((entry) => entry.status === "warning")) return "warning";
  return "ready";
}

export function getScannerDiagnostics(): ScannerDiagnostics {
  const photoProvider = getPhotoProvider();
  const openaiReady = hasEnv("OPENAI_API_KEY");
  const geminiReady = hasEnv("GEMINI_API_KEY");
  const jwtReady = hasEnv("JWT_SECRET");
  const databaseReady = hasEnv("DATABASE_URL");
  const cloudinaryReady =
    hasEnv("CLOUDINARY_CLOUD_NAME") && hasEnv("CLOUDINARY_API_KEY") && hasEnv("CLOUDINARY_API_SECRET");

  const items: ScannerDiagnosticItem[] = [
    databaseReady
      ? item("database", "Database", "ready", "DATABASE_URL is configured")
      : item("database", "Database", "missing", "DATABASE_URL is required"),
    jwtReady
      ? item("auth", "Auth secret", "ready", "JWT_SECRET is configured")
      : item("auth", "Auth secret", "missing", "JWT_SECRET is required for stable sessions"),
    openaiReady
      ? item("openai", "OpenAI", "ready", "Configured")
      : item("openai", "OpenAI", photoProvider === "openai" ? "missing" : "warning", "Not configured", true),
    geminiReady
      ? item("gemini", "Gemini Vision", "ready", "Configured")
      : item("gemini", "Gemini Vision", photoProvider === "gemini" ? "missing" : "warning", "Not configured", true),
    cloudinaryReady
      ? item("cloudinary", "Image storage", "ready", "Cloudinary is configured", true)
      : item("cloudinary", "Image storage", "warning", "Optional: images are processed but not persisted", true),
    configuredItem("usda", "USDA lookup", "USDA_FDC_API_KEY", true),
    configuredItem("barcode-lookup", "Barcode Lookup API", "BARCODE_LOOKUP_API_KEY", true),
  ];

  const photoReady =
    photoProvider === "openai"
      ? openaiReady
      : photoProvider === "gemini"
        ? geminiReady
        : openaiReady || geminiReady;

  items.push(
    photoReady
      ? item(
          "photo-flow",
          "Photo recognition",
          "ready",
          photoProvider === "auto" ? "Auto fallback is available" : `${photoProvider} is selected`
        )
      : item("photo-flow", "Photo recognition", "missing", "Configure OpenAI or Gemini for photo recognition")
  );

  return {
    overallStatus: getOverallStatus(items),
    photoRecognitionProvider: photoProvider,
    items,
  };
}
