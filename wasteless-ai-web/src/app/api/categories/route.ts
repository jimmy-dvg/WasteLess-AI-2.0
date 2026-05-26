import { NextResponse } from "next/server";
import { createCategory, getCategoriesForUser } from "@/services/inventory.service";
import { requireApiUser } from "@/lib/auth";
import { categorySchema } from "@/validation/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  try {
    const categories = await getCategoriesForUser(auth.user.id);
    return NextResponse.json({ success: true, data: { categories } }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Categories are unavailable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid category" },
      { status: 400 }
    );
  }

  try {
    const category = await createCategory(auth.user.id, {
      name: parsed.data.name,
      color: parsed.data.color || null,
    });

    if (!category) {
      return NextResponse.json({ success: false, error: "Unable to create category" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { category } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to create category" }, { status: 500 });
  }
}
