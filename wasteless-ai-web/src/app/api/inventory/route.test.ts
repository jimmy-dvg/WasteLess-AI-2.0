import { NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  getInventoryPageData: vi.fn(),
  createProduct: vi.fn(),
  getProductById: vi.fn(),
  recordHouseholdActivity: vi.fn(),
  getEditableInventoryHousehold: vi.fn(),
  inventoryError: vi.fn((error: string, status: number) =>
    NextResponse.json({ success: false, error }, { status })
  ),
  parseProductMutationRequest: vi.fn(),
  revalidateInventoryPaths: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireApiUser: mocks.requireApiUser,
}));

vi.mock("@/services/inventory.service", () => ({
  createProduct: mocks.createProduct,
  getInventoryPageData: mocks.getInventoryPageData,
  getProductById: mocks.getProductById,
}));

vi.mock("@/features/household/services/household.service", () => ({
  recordHouseholdActivity: mocks.recordHouseholdActivity,
}));

vi.mock("./_utils", () => ({
  getEditableInventoryHousehold: mocks.getEditableInventoryHousehold,
  inventoryError: mocks.inventoryError,
  parseProductMutationRequest: mocks.parseProductMutationRequest,
  revalidateInventoryPaths: mocks.revalidateInventoryPaths,
}));

import { GET } from "./route";

const apiUser = { id: "user-1", email: "ada@example.com", name: "Ada Lovelace" };

function inventoryRequest(query = "") {
  return new Request(`http://test.local/api/inventory${query}`);
}

describe("GET /api/inventory", () => {
  it("returns unauthorized responses from auth", async () => {
    mocks.requireApiUser.mockResolvedValueOnce({
      success: false,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    });

    const response = await GET(inventoryRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "Unauthorized" });
    expect(mocks.getInventoryPageData).not.toHaveBeenCalled();
  });

  it("validates filters before querying inventory data", async () => {
    mocks.requireApiUser.mockResolvedValueOnce({ success: true, user: apiUser });

    const response = await GET(inventoryRequest("?pageSize=500"));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false });
    expect(mocks.getInventoryPageData).not.toHaveBeenCalled();
  });

  it("passes parsed pagination and filters into the inventory service", async () => {
    const pageData = {
      items: [],
      categories: [],
      locations: [],
      totalCount: 0,
      page: 2,
      pageSize: 25,
      pageCount: 1,
    };
    mocks.requireApiUser.mockResolvedValueOnce({ success: true, user: apiUser });
    mocks.getInventoryPageData.mockResolvedValueOnce(pageData);

    const response = await GET(
      inventoryRequest("?query=milk&status=expiring&page=2&pageSize=25&sort=name_asc")
    );

    expect(response.status).toBe(200);
    expect(mocks.getInventoryPageData).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        query: "milk",
        status: "expiring",
        categoryId: "all",
        location: "all",
        sort: "name_asc",
        page: 2,
        pageSize: 25,
      })
    );
    expect(await response.json()).toEqual({ success: true, data: pageData });
  });
});
