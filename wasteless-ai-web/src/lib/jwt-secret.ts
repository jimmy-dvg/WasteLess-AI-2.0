const JWT_SECRET_ERROR_MESSAGE =
  "JWT_SECRET is required for session token signing and verification. Set it in the environment for all runtimes, including tests.";

export class JwtSecretMissingError extends Error {
  constructor() {
    super(JWT_SECRET_ERROR_MESSAGE);
    this.name = "JwtSecretMissingError";
  }
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

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
