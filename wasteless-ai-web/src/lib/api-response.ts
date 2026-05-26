import "server-only";

export function safeRouteErrorMessage(error: unknown, fallback: string) {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd && error instanceof Error && error.message) return error.message;
  return fallback;
}
