import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { aiGateway } from "@/ai/gateway";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();

  try {
    assertRateLimit(`ai:ollama:models:${user.id}`, 10, 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) {
      const retryAfter = Math.max(1, Math.ceil((error.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded", retryAfter },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  const models = await aiGateway.listProviderModels("ollama");
  return NextResponse.json({ success: true, data: { models } }, { status: 200 });
}
