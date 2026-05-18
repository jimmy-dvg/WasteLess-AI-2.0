import { requireUser } from "@/lib/auth";

export async function requireUserId() {
  const user = await requireUser();
  return user.id;
}
