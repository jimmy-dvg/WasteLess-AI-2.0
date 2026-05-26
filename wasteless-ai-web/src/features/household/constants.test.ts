import { describe, expect, it } from "vitest";
import {
  canEditHouseholdInventory,
  canManageHousehold,
  canManageRole,
  isHouseholdRole,
} from "./constants";

describe("household role permissions", () => {
  it("recognizes supported household roles", () => {
    expect(isHouseholdRole("owner")).toBe(true);
    expect(isHouseholdRole("admin")).toBe(true);
    expect(isHouseholdRole("member")).toBe(true);
    expect(isHouseholdRole("guest")).toBe(true);
    expect(isHouseholdRole("superuser")).toBe(false);
  });

  it("limits household management to owners and admins", () => {
    expect(canManageHousehold("owner")).toBe(true);
    expect(canManageHousehold("admin")).toBe(true);
    expect(canManageHousehold("member")).toBe(false);
    expect(canManageHousehold("guest")).toBe(false);
  });

  it("allows inventory edits for collaboration roles but not guests", () => {
    expect(canEditHouseholdInventory("owner")).toBe(true);
    expect(canEditHouseholdInventory("admin")).toBe(true);
    expect(canEditHouseholdInventory("member")).toBe(true);
    expect(canEditHouseholdInventory("guest")).toBe(false);
  });

  it("prevents admins from managing owners", () => {
    expect(canManageRole("owner", "admin")).toBe(true);
    expect(canManageRole("admin", "member")).toBe(true);
    expect(canManageRole("admin", "owner")).toBe(false);
    expect(canManageRole("member", "guest")).toBe(false);
  });
});
