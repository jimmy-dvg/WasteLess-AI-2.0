import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { aiGateway } from "@/ai/gateway";
import { aiProviderSchema } from "@/validation/ai";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;
  const { user } = auth;

  try {
    assertRateLimit(`ai:test:${user.id}`, 12, 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) {
      const retryAfter = Math.max(1, Math.ceil((error.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded", retryAfter },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = aiProviderSchema.safeParse((body as { provider?: string } | null)?.provider);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid provider" }, { status: 400 });
  }

  const statuses = await aiGateway.getProviderStatuses(true);
  const status = statuses.find((entry) => entry.provider === parsed.data);
  if (!status) {
    return NextResponse.json({ success: false, error: "Provider not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { status } }, { status: 200 });
}
