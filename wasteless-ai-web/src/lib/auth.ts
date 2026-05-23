import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/tables";
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

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.sub)).limit(1);
    if (!user || user.length === 0) return null;
    const u = user[0];
    return { id: u.id, email: u.email, name: u.name };
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
