import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  runNotificationChecksForAllUsers,
  runNotificationChecksForUser,
} from "@/features/notifications/services/notification.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.NOTIFICATIONS_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return false;

  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const headerSecret = request.headers.get("x-cron-secret") ?? "";

  return bearer === secret || headerSecret === secret;
}

async function runChecks(request: Request) {
  if (isAuthorizedCronRequest(request)) {
    const result = await runNotificationChecksForAllUsers();
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runNotificationChecksForUser(user.id);
  return NextResponse.json({ success: true, data: result }, { status: 200 });
}

export async function GET(request: Request) {
  return runChecks(request);
}

export async function POST(request: Request) {
  return runChecks(request);
}
