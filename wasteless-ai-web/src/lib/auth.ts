import { cookies } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { verifyToken } from "./jwt";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || !payload.sub) return null;

    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.sub)).limit(1);
    if (!user || user.length === 0) return null;
    const u = user[0];
    return { id: u.id, email: u.email, name: u.name };
  } catch (err) {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
