import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteCategory, updateCategory } from "@/services/inventory.service";
import { requireApiUser } from "@/lib/auth";
import { categorySchema } from "@/validation/inventory";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getCategoryId(context: RouteContext) {
  const { id } = await context.params;
  return id;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const id = await getCategoryId(context);
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid category" },
      { status: 400 }
    );
  }

  try {
    const category = await updateCategory(auth.user.id, parsedId.data, {
      name: parsed.data.name,
      color: parsed.data.color || null,
    });

    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { category } }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to update category" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const id = await getCategoryId(context);
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
  }

  try {
    const deleted = await deleteCategory(auth.user.id, parsedId.data);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to delete category" }, { status: 500 });
  }
}
