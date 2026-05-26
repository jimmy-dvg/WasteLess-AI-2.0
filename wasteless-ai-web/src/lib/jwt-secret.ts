import { authEnvSchema, parseEnv } from "@/env/schema";

const JWT_SECRET_ERROR_MESSAGE =
  "JWT_SECRET is required for session token signing and verification. Set it in the environment for all runtimes, including tests.";

export class JwtSecretMissingError extends Error {
  constructor(message = JWT_SECRET_ERROR_MESSAGE) {
    super(message);
    this.name = "JwtSecretMissingError";
  }
}

export function getJwtSecret() {
  let secret: string | undefined;

  try {
    secret = parseEnv(authEnvSchema, process.env, { scope: "auth" }).JWT_SECRET;
  } catch (error) {
    if (error instanceof Error) {
      throw new JwtSecretMissingError(error.message);
    }
    throw error;
  }

  if (!secret) {
    throw new JwtSecretMissingError();
  }

  return secret;
}

export function getJwtSecretBytes() {
  return new TextEncoder().encode(getJwtSecret());
}

export function isJwtSecretMissingError(error: unknown) {
  return error instanceof Error && error.name === "JwtSecretMissingError";
}
