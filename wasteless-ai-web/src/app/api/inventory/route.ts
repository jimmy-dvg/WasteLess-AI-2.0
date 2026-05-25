import { NextResponse } from "next/server";
import { recordHouseholdActivity } from "@/features/household/services/household.service";
import { requireApiUser } from "@/lib/auth";
import {
  createProduct,
  getInventoryPageData,
  getProductById,
} from "@/services/inventory.service";
import { inventoryFilterSchema } from "@/validation/inventory";
import {
  getEditableInventoryHousehold,
  inventoryError,
  parseProductMutationRequest,
  revalidateInventoryPaths,
} from "./_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSearchParam(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key) ?? undefined;
}

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const url = new URL(request.url);
  const parsedFilters = inventoryFilterSchema.safeParse({
    query: getSearchParam(url.searchParams, "query"),
    status: getSearchParam(url.searchParams, "status"),
    categoryId: getSearchParam(url.searchParams, "categoryId"),
    location: getSearchParam(url.searchParams, "location"),
    sort: getSearchParam(url.searchParams, "sort"),
    page: getSearchParam(url.searchParams, "page"),
    pageSize: getSearchParam(url.searchParams, "pageSize"),
  });

  if (!parsedFilters.success) {
    return inventoryError(parsedFilters.error.issues[0]?.message ?? "Invalid inventory filters", 400);
  }

  try {
    const data = await getInventoryPageData(auth.user.id, parsedFilters.data);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return inventoryError("Inventory data is unavailable", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);

  try {
    const editableHousehold = await getEditableInventoryHousehold(auth.user);
    if (!editableHousehold.success) return editableHousehold.response;

    const parsed = await parseProductMutationRequest(
      body,
      auth.user.id,
      editableHousehold.household.id
    );
    if (!parsed.success) return parsed.response;

    const created = await createProduct(auth.user.id, parsed.data);
    if (!created) return inventoryError("Unable to add inventory item", 500);

    const item = await getProductById(auth.user.id, created.id);
    if (!item) return inventoryError("Unable to load created inventory item", 500);

    revalidateInventoryPaths();

    await recordHouseholdActivity({
      householdId: editableHousehold.household.id,
      actorUserId: auth.user.id,
      eventType: "inventory_product_created",
      objectType: "product",
      objectId: created.id,
      summary: `${auth.user.name} added ${parsed.data.name} to inventory.`,
      metadata: {
        quantity: parsed.data.quantity,
        unit: parsed.data.unit,
      },
    }).catch(() => undefined);

    return NextResponse.json({ success: true, data: { item } }, { status: 201 });
  } catch {
    return inventoryError("Unable to add inventory item right now", 500);
  }
}
