import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getAuthenticatedUserById } from "@/features/auth/auth.service";
import { SESSION_COOKIE_NAME } from "./auth-constants";
import { verifyToken } from "./jwt";
import { isJwtSecretMissingError } from "./jwt-secret";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
};

export type ApiUserResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; response: NextResponse<{ success: false; error: "Unauthorized" }> };

function getBearerToken(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const token =
      cookieStore.get(SESSION_COOKIE_NAME)?.value ?? getBearerToken(headerStore.get("authorization"));
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    return getAuthenticatedUserById(payload.sub);
  } catch (error) {
    if (isJwtSecretMissingError(error)) throw error;
    return null;
  }
}

export async function requireApiUser(): Promise<ApiUserResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { success: true, user };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
