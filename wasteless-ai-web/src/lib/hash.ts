import "server-only";

import { createHash } from "crypto";

export function hashJson(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
