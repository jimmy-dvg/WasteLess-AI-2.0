import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

type SessionTokenPayload = jwt.JwtPayload & {
  sub?: string;
};

export function signToken(payload: object, options: jwt.SignOptions = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d", ...options });
}

export function verifyToken(token: string): SessionTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return typeof decoded === "string" ? null : (decoded as SessionTokenPayload);
  } catch {
    return null;
  }
}
