import { NextResponse } from "next/server";
import { suggestProductStorage } from "@/features/categories/services/storage-organizer.service";
import { getCurrentUser } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { storageSuggestionRequestSchema } from "@/validation/categories";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = storageSuggestionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid product name" },
      { status: 400 }
    );
  }

  try {
    assertRateLimit(`categories:suggest:${user.id}`, 20, 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) {
      const retryAfter = Math.max(1, Math.ceil((error.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded", retryAfter },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  const suggestion = await suggestProductStorage(parsed.data.productName, { userId: user.id });
  return NextResponse.json({ success: true, data: suggestion }, { status: 200 });
}
