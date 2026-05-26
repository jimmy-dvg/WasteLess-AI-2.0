import { NextResponse } from "next/server";
import { ensurePersonalHouseholdForUser } from "@/db/queries/households";
import {
  getNotificationSettingsForUser,
  updateNotificationSettingsForHousehold,
} from "@/features/notifications/services/notification.service";
import { requireApiUser } from "@/lib/auth";
import { notificationSettingsSchema } from "@/validation/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notificationPreferencesError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  try {
    const data = await getNotificationSettingsForUser(auth.user.id);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return notificationPreferencesError("Notification preferences are unavailable", 500);
  }
}

async function savePreferences(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = notificationSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return notificationPreferencesError(parsed.error.issues[0]?.message ?? "Invalid notification preferences", 400);
  }

  try {
    const household = await ensurePersonalHouseholdForUser(auth.user);
    const settings = await updateNotificationSettingsForHousehold(household.id, parsed.data);
    return NextResponse.json({ success: true, data: { household, settings } }, { status: 200 });
  } catch {
    return notificationPreferencesError("Unable to update notification preferences right now", 500);
  }
}

export async function PATCH(request: Request) {
  return savePreferences(request);
}

export async function POST(request: Request) {
  return savePreferences(request);
}
