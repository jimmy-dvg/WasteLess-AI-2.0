import { NextResponse } from "next/server";
import {
  deactivateExpoPushTokenForUser,
  registerExpoPushTokenForUser,
} from "@/features/notifications/services/push-token.service";
import { requireApiUser } from "@/lib/auth";
import {
  notificationPushTokenDeleteSchema,
  notificationPushTokenSchema,
} from "@/validation/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pushTokenError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = notificationPushTokenSchema.safeParse(body);

  if (!parsed.success) {
    return pushTokenError(parsed.error.issues[0]?.message ?? "Invalid Expo push token", 400);
  }

  try {
    const token = await registerExpoPushTokenForUser(auth.user, parsed.data);
    return NextResponse.json({ success: true, data: { token } }, { status: 200 });
  } catch {
    return pushTokenError("Unable to register Expo push token right now", 500);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = notificationPushTokenDeleteSchema.safeParse(body);

  if (!parsed.success) {
    return pushTokenError(parsed.error.issues[0]?.message ?? "Invalid Expo push token removal request", 400);
  }

  try {
    const deactivatedCount = await deactivateExpoPushTokenForUser(auth.user.id, parsed.data);
    return NextResponse.json({ success: true, data: { deactivatedCount } }, { status: 200 });
  } catch {
    return pushTokenError("Unable to remove Expo push token right now", 500);
  }
}
