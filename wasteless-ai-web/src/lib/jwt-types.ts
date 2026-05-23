export type SessionTokenPayload = {
  sub: string;
};

export type VerifiedSessionTokenPayload = SessionTokenPayload & {
  exp?: number;
  iat?: number;
};

export function isSessionTokenPayload(payload: unknown): payload is VerifiedSessionTokenPayload {
  if (!payload || typeof payload !== "object") return false;

  const candidate = payload as { sub?: unknown };
  return typeof candidate.sub === "string" && candidate.sub.length > 0;
}
