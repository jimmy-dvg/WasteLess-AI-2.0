import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPassword } from "@/features/auth/auth.service";
import { setSessionCookie } from "@/features/auth/session-cookie";
import { isJwtSecretMissingError } from "@/lib/jwt-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid login input" },
      { status: 400 }
    );
  }

  try {
    const result = await loginWithPassword(parsed.data);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    const response = NextResponse.json(
      { success: true, data: { user: result.user, token: result.token } },
      { status: 200 }
    );
    setSessionCookie(response, result.token);

    return response;
  } catch (error) {
    if (isJwtSecretMissingError(error)) {
      return NextResponse.json(
        { success: false, error: "Authentication service is not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: false, error: "Unable to sign you in" }, { status: 500 });
  }
}
