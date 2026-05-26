import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatQuantity,
  formatRelativeExpiration,
  getExpirationStatus,
  getInitials,
  parseJsonValue,
  toDate,
} from "./dashboard-utils";

describe("dashboard utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 26, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("normalizes supported date inputs and rejects invalid values", () => {
    expect(toDate(new Date(2026, 4, 26))).toBeInstanceOf(Date);
    expect(toDate("2026-05-26")).toBeInstanceOf(Date);
    expect(toDate("not-a-date")).toBeNull();
    expect(toDate(null)).toBeNull();
  });

  it("classifies expiration status relative to today", () => {
    expect(getExpirationStatus(new Date(2026, 4, 25))).toBe("expired");
    expect(getExpirationStatus(new Date(2026, 4, 26))).toBe("expiring");
    expect(getExpirationStatus(new Date(2026, 5, 5))).toBe("fresh");
  });

  it("formats relative expiration labels", () => {
    expect(formatRelativeExpiration(new Date(2026, 4, 25))).toBe("1 day overdue");
    expect(formatRelativeExpiration(new Date(2026, 4, 26))).toBe("Expires today");
    expect(formatRelativeExpiration(new Date(2026, 4, 27))).toBe("Expires tomorrow");
    expect(formatRelativeExpiration(new Date(2026, 4, 29))).toBe("Expires in 3 days");
  });

  it("formats quantities without trailing zero noise", () => {
    expect(formatQuantity("2.500", "kg")).toBe("2.5 kg");
    expect(formatQuantity("4.00", null)).toBe("4");
    expect(formatQuantity(null, "pcs")).toBe("0 pcs");
  });

  it("parses JSON values with fallback behavior", () => {
    expect(parseJsonValue('{"mode":"rescue"}', {})).toEqual({ mode: "rescue" });
    expect(parseJsonValue("invalid-json", { mode: "overview" })).toEqual({ mode: "overview" });
    expect(parseJsonValue({ direct: true }, {})).toEqual({ direct: true });
  });

  it("builds stable two-letter initials", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
    expect(getInitials("  Grace   Hopper ")).toBe("GH");
  });
});
