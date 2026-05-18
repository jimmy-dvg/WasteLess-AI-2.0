import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateRecipesForUser } from "@/services/recipes.service";
import { recipeGenerationRequestSchema } from "@/validation/recipes";
import { RateLimitError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Recipe generation failed";
}

function createSseStream(handler: (send: (event: string, data: unknown) => void) => Promise<void>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        await handler(send);
      } catch (error) {
        send("error", { message: toErrorMessage(error) });
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = recipeGenerationRequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const stream = new URL(request.url).searchParams.get("stream") === "1";
  const payload = parsed.data;

  if (stream) {
    const sseStream = createSseStream(async (send) => {
      send("status", { message: "Analyzing inventory" });
      try {
        const result = await generateRecipesForUser({
          userId: user.id,
          maxRecipes: payload.maxRecipes,
          includeExpired: payload.includeExpired,
          preferencesOverride: payload.preferencesOverride,
        });
        send("status", { message: "Finalizing recommendations" });
        send("result", result);
      } catch (error) {
        if (error instanceof RateLimitError) {
          const retryAfter = Math.max(1, Math.ceil((error.resetAt - Date.now()) / 1000));
          send("rate_limit", { retryAfter });
          return;
        }
        throw error;
      }
    });

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  try {
    const result = await generateRecipesForUser({
      userId: user.id,
      maxRecipes: payload.maxRecipes,
      includeExpired: payload.includeExpired,
      preferencesOverride: payload.preferencesOverride,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      const retryAfter = Math.max(1, Math.ceil((error.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
