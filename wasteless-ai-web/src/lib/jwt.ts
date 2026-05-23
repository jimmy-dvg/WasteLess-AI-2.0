import jwt from "jsonwebtoken";
import { getJwtSecret } from "./jwt-secret";
import { isSessionTokenPayload, type SessionTokenPayload, type VerifiedSessionTokenPayload } from "./jwt-types";

export type { SessionTokenPayload, VerifiedSessionTokenPayload } from "./jwt-types";

export type SessionSignOptions = Omit<jwt.SignOptions, "algorithm">;

export function signToken(payload: SessionTokenPayload, options: SessionSignOptions = {}) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d", ...options, algorithm: "HS256" });
}

export function verifyToken(token: string): VerifiedSessionTokenPayload | null {
  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    return isSessionTokenPayload(decoded) ? decoded : null;
  } catch {
    return null;
  }
}
