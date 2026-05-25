import { NextResponse } from "next/server";
import { recordHouseholdActivity } from "@/features/household/services/household.service";
import { requireApiUser } from "@/lib/auth";
import {
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/services/inventory.service";
import {
  getEditableInventoryHousehold,
  inventoryError,
  isUuid,
  parseProductMutationRequest,
  revalidateInventoryPaths,
} from "../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getInventoryItemId(context: RouteContext) {
  const { id } = await context.params;
  return id;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const id = await getInventoryItemId(context);
  if (!isUuid(id)) return inventoryError("Invalid inventory item id", 400);

  try {
    const item = await getProductById(auth.user.id, id);
    if (!item) return inventoryError("Inventory item not found", 404);

    return NextResponse.json({ success: true, data: { item } }, { status: 200 });
  } catch {
    return inventoryError("Unable to load inventory item", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const id = await getInventoryItemId(context);
  if (!isUuid(id)) return inventoryError("Invalid inventory item id", 400);

  const body = await request.json().catch(() => null);

  try {
    const editableHousehold = await getEditableInventoryHousehold(auth.user);
    if (!editableHousehold.success) return editableHousehold.response;

    const currentItem = await getProductById(auth.user.id, id);
    if (!currentItem) return inventoryError("Inventory item not found", 404);

    const parsed = await parseProductMutationRequest(
      body,
      auth.user.id,
      editableHousehold.household.id
    );
    if (!parsed.success) return parsed.response;

    const updated = await updateProduct(auth.user.id, id, parsed.data);
    if (!updated) return inventoryError("Inventory item not found", 404);

    const item = await getProductById(auth.user.id, id);
    if (!item) return inventoryError("Unable to load updated inventory item", 500);

    revalidateInventoryPaths();

    await recordHouseholdActivity({
      householdId: editableHousehold.household.id,
      actorUserId: auth.user.id,
      eventType: "inventory_product_updated",
      objectType: "product",
      objectId: id,
      summary: `${auth.user.name} updated ${parsed.data.name}.`,
    }).catch(() => undefined);

    return NextResponse.json({ success: true, data: { item } }, { status: 200 });
  } catch {
    return inventoryError("Unable to update inventory item right now", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const id = await getInventoryItemId(context);
  if (!isUuid(id)) return inventoryError("Invalid inventory item id", 400);

  try {
    const editableHousehold = await getEditableInventoryHousehold(auth.user);
    if (!editableHousehold.success) return editableHousehold.response;

    const item = await getProductById(auth.user.id, id);
    if (!item) return inventoryError("Inventory item not found", 404);

    const deleted = await deleteProduct(auth.user.id, editableHousehold.household.id, id);
    if (!deleted) return inventoryError("Inventory item not found", 404);

    revalidateInventoryPaths();

    await recordHouseholdActivity({
      householdId: editableHousehold.household.id,
      actorUserId: auth.user.id,
      eventType: "inventory_product_deleted",
      objectType: "product",
      objectId: id,
      summary: `${auth.user.name} removed ${item.name} from inventory.`,
    }).catch(() => undefined);

    return new NextResponse(null, { status: 204 });
  } catch {
    return inventoryError("Unable to delete inventory item right now", 500);
  }
}
