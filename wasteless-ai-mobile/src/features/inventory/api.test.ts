import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/api/client";
import { createInventoryItem, listInventoryItems } from "./api";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}));

vi.mock("@/services/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/services/api/client")>("@/services/api/client");

  return {
    ...actual,
    apiRequest: mocks.apiRequest,
  };
});

describe("mobile inventory API integration", () => {
  it("builds paged inventory queries and parses server responses", async () => {
    mocks.apiRequest.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: "item-1",
            name: "Milk",
            quantity: "2",
            unit: "l",
            status: "expiring",
            createdAt: "2026-05-26T10:00:00.000Z",
            updatedAt: "2026-05-26T10:00:00.000Z",
          },
        ],
        categories: [{ id: "cat-1", name: "Dairy", color: "#22c55e", createdAt: "2026-05-26" }],
        locations: ["fridge"],
        totalCount: 1,
        page: 2,
        pageSize: 10,
        pageCount: 1,
      },
    });

    const result = await listInventoryItems("token-123", {
      query: "milk",
      status: "expiring",
      page: 2,
      pageSize: 10,
    });

    expect(mocks.apiRequest).toHaveBeenCalledWith(
      "/api/inventory?query=milk&status=expiring&categoryId=all&location=all&sort=expiration_asc&page=2&pageSize=10",
      { authToken: "token-123" }
    );
    expect(result.items[0]).toMatchObject({
      id: "item-1",
      name: "Milk",
      status: "expiring",
      categoryId: null,
    });
    expect(result.categories[0]).toMatchObject({ id: "cat-1", name: "Dairy" });
  });

  it("trims create payloads before sending them to the API", async () => {
    mocks.apiRequest.mockResolvedValueOnce({
      success: true,
      data: {
        item: {
          id: "item-2",
          name: "Rice",
          quantity: "2",
          unit: "kg",
          status: "fresh",
        },
      },
    });

    await createInventoryItem("token-123", {
      name: " Rice ",
      quantity: " 2 ",
      unit: " kg ",
      categoryId: null,
      purchaseDate: "",
      expirationDate: "",
      storageLocation: " pantry ",
      notes: " staple ",
    });

    expect(mocks.apiRequest).toHaveBeenCalledWith("/api/inventory", {
      authToken: "token-123",
      method: "POST",
      body: JSON.stringify({
        name: "Rice",
        quantity: "2",
        unit: "kg",
        category_id: "",
        purchase_date: "",
        expiration_date: "",
        storage_location: "pantry",
        notes: "staple",
      }),
    });
  });

  it("rejects malformed success payloads", async () => {
    mocks.apiRequest.mockResolvedValueOnce({ success: true, data: { item: { id: "", name: "" } } });

    await expect(createInventoryItem("token-123", { name: "Bad", quantity: "1" })).rejects.toBeInstanceOf(
      ApiError
    );
  });
});
