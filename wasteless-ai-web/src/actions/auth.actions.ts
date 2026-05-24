"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { isJwtSecretMissingError } from "@/lib/jwt-secret";
import { loginWithPassword, registerWithPassword } from "@/features/auth/auth.service";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Confirm password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export type AuthActionState = {
  success: boolean;
  error?: string | null;
};

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

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
    const result = await registerWithPassword({
      name: parsed.data.full_name,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    await setSessionCookie(result.token);
  } catch (error) {
    if (isJwtSecretMissingError(error)) throw error;

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
    const result = await loginWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    await setSessionCookie(result.token);
  } catch (error) {
    if (isJwtSecretMissingError(error)) throw error;

    return { success: false, error: "Unable to sign you in" };
  }

  // Redirect to dashboard after successful login
  redirect("/dashboard");
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
