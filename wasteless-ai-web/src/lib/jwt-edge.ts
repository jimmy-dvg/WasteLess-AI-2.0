import { jwtVerify } from "jose";
import { getJwtSecretBytes } from "./jwt-secret";
import { isSessionTokenPayload, type VerifiedSessionTokenPayload } from "./jwt-types";

export async function verifyTokenEdge(token: string): Promise<VerifiedSessionTokenPayload | null> {
  const secret = getJwtSecretBytes();

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return isSessionTokenPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}
