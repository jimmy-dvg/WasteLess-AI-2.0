import { describe, expect, it } from "vitest";
import { categorySchema, inventoryFilterSchema, productSchema } from "./inventory";

describe("inventory validation", () => {
  it("trims and validates product input", () => {
    const parsed = productSchema.parse({
      name: "  Milk  ",
      quantity: " 2 ",
      unit: " l ",
      category_id: "",
      purchase_date: "",
      expiration_date: "2026-06-01",
      storage_location: "fridge",
      notes: "  Use first ",
    });

    expect(parsed).toMatchObject({
      name: "Milk",
      quantity: "2",
      unit: "l",
      notes: "Use first",
    });
  });

  it("rejects invalid product payloads", () => {
    const parsed = productSchema.safeParse({
      name: "A",
      quantity: "",
      category_id: "not-a-uuid",
    });

    expect(parsed.success).toBe(false);
  });

  it("validates category colors as hex values", () => {
    expect(categorySchema.safeParse({ name: "Dairy", color: "#22c55e" }).success).toBe(true);
    expect(categorySchema.safeParse({ name: "Dairy", color: "green" }).success).toBe(false);
  });

  it("applies safe defaults and pagination bounds to filters", () => {
    const parsed = inventoryFilterSchema.parse({
      page: "2",
      pageSize: "25",
      status: "expiring",
      sort: "name_asc",
    });

    expect(parsed).toEqual({
      query: "",
      status: "expiring",
      categoryId: "all",
      location: "all",
      sort: "name_asc",
      page: 2,
      pageSize: 25,
    });

    expect(inventoryFilterSchema.safeParse({ pageSize: "500" }).success).toBe(false);
  });
});
