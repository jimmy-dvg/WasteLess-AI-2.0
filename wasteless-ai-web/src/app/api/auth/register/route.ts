import { NextResponse } from "next/server";
import { z } from "zod";
import { registerWithPassword } from "@/features/auth/auth.service";
import { setSessionCookie } from "@/features/auth/session-cookie";
import { isJwtSecretMissingError } from "@/lib/jwt-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const registerRequestSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid registration input" },
      { status: 400 }
    );
  }

  try {
    const result = await registerWithPassword(parsed.data);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    const response = NextResponse.json(
      { success: true, data: { user: result.user, token: result.token } },
      { status: 201 }
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

    return NextResponse.json({ success: false, error: "Unable to create account" }, { status: 500 });
  }
}
