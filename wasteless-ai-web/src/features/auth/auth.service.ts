import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/tables";
import type { AuthenticatedUser } from "@/lib/auth";
import { signToken } from "@/lib/jwt";
import { isJwtSecretMissingError } from "@/lib/jwt-secret";

export const DUPLICATE_EMAIL_ERROR = "An account with this email already exists.";

type AuthErrorStatus = 401 | 409 | 500;

type AuthFailure = {
  success: false;
  error: string;
  status: AuthErrorStatus;
};

type AuthSuccess = {
  success: true;
  user: AuthenticatedUser;
  token: string;
};

export type AuthServiceResult = AuthSuccess | AuthFailure;

export type RegisterWithPasswordInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginWithPasswordInput = {
  email: string;
  password: string;
};

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; cause?: unknown };
  if (candidate.code === "23505") return true;

  return isUniqueViolation(candidate.cause);
}

function toAuthenticatedUser(user: typeof schema.users.$inferSelect): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function getAuthenticatedUserById(userId: string): Promise<AuthenticatedUser | null> {
  const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  const user = users[0];

  return user ? toAuthenticatedUser(user) : null;
}

export async function registerWithPassword(input: RegisterWithPasswordInput): Promise<AuthServiceResult> {
  try {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();

    const user = await db.transaction(async (tx) => {
      const insert = await tx
        .insert(schema.users)
        .values({
          email,
          name,
          password_hash: passwordHash,
        })
        .onConflictDoNothing({ target: schema.users.email })
        .returning();

      const created = insert[0];
      if (!created) return null;

      await tx.insert(schema.profiles).values({
        id: created.id,
        email: created.email,
      });

      return created;
    });

    if (!user) {
      return { success: false, error: DUPLICATE_EMAIL_ERROR, status: 409 };
    }

    return {
      success: true,
      user: toAuthenticatedUser(user),
      token: signToken({ sub: user.id }),
    };
  } catch (error) {
    if (isJwtSecretMissingError(error)) throw error;

    if (isUniqueViolation(error)) {
      return { success: false, error: DUPLICATE_EMAIL_ERROR, status: 409 };
    }

    return { success: false, error: "Unable to create account", status: 500 };
  }
}

export async function loginWithPassword(input: LoginWithPasswordInput): Promise<AuthServiceResult> {
  try {
    const email = input.email.trim().toLowerCase();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    const user = users[0];

    if (!user) {
      return { success: false, error: "Invalid email or password", status: 401 };
    }

    if (!user.password_hash) {
      return { success: false, error: "Account does not have a password set", status: 401 };
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password", status: 401 };
    }

    return {
      success: true,
      user: toAuthenticatedUser(user),
      token: signToken({ sub: user.id }),
    };
  } catch (error) {
    if (isJwtSecretMissingError(error)) throw error;

    return { success: false, error: "Unable to sign you in", status: 500 };
  }
}
