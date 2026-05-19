import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { aiGateway } from "@/ai/gateway";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import type { AIProviderStatus } from "@/ai/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireUser();

  try {
    assertRateLimit(`ai:status:${user.id}`, 8, 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) {
      const retryAfter = Math.max(1, Math.ceil((error.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded", retryAfter },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";
  const includeModels = url.searchParams.get("models") === "1";

  const statuses = await aiGateway.getProviderStatuses(refresh);
  let providers: AIProviderStatus[] = statuses;

  if (includeModels) {
    providers = await Promise.all(
      statuses.map(async (status) => ({
        ...status,
        models: await aiGateway.listProviderModels(status.provider),
      }))
    );
  }

  return NextResponse.json({ success: true, data: { providers } }, { status: 200 });
}
