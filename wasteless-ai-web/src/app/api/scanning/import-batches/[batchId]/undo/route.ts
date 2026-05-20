import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { undoScanImportBatch } from "@/scanning/scan-history.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ batchId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireUser();
  const { batchId } = await context.params;

  try {
    const result = await undoScanImportBatch(user.id, batchId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to undo import";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
