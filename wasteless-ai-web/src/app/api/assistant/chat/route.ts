import { NextResponse } from "next/server";
import { runAssistantChat } from "@/features/assistant/services/assistant.service";
import { getCurrentUser } from "@/lib/auth";
import { RateLimitError } from "@/lib/rate-limit";
import { assistantChatRequestSchema } from "@/validation/assistant";

export const dynamic = "force-dynamic";

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Assistant request failed";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = assistantChatRequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const data = await runAssistantChat({
      user,
      messages: parsed.data.messages,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      const retryAfter = Math.max(1, Math.ceil((error.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded", retryAfter },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    return NextResponse.json({ success: false, error: toErrorMessage(error) }, { status: 500 });
  }
}
