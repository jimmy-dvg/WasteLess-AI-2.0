"use server";

import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import { cookies } from "next/headers";
import { signToken } from "@/lib/jwt";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Confirm password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type AuthActionState = {
  success: boolean;
  error?: string | null;
};

export async function registerUser(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const data = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid registration input",
    };
  }
  if (parsed.data.password !== parsed.data.confirm_password) {
    return { success: false, error: "Passwords do not match" };
  }

  try {
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, parsed.data.email))
      .limit(1);
    if (existing.length > 0) {
      return { success: false, error: "Email already in use" };
    }

    const password_hash = await bcrypt.hash(parsed.data.password, 10);

    const user = await db.transaction(async (tx) => {
      const insert = await tx
        .insert(schema.users)
        .values({
          email: parsed.data.email,
          name: parsed.data.full_name,
          password_hash,
        })
        .returning();

      const created = insert[0];
      await tx.insert(schema.profiles).values({
        id: created.id,
        email: created.email,
      });

      return created;
    });

    const token = signToken({ sub: user.id });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    return { success: false, error: "Unable to create account" };
  }

  // Redirect to dashboard after successful registration
  redirect("/dashboard");
}

export async function loginUser(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const data = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid login input",
    };
  }

  try {
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, parsed.data.email))
      .limit(1);
    if (users.length === 0) {
      return { success: false, error: "Invalid email or password" };
    }
    const user = users[0];

    if (!user.password_hash) {
      return { success: false, error: "Account does not have a password set" };
    }

    const ok = await bcrypt.compare(parsed.data.password, user.password_hash);
    if (!ok) {
      return { success: false, error: "Invalid email or password" };
    }

    const token = signToken({ sub: user.id });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    return { success: false, error: "Unable to sign you in" };
  }

  // Redirect to dashboard after successful login
  redirect("/dashboard");
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
