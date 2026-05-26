import { describe, expect, it } from "vitest";
import { ApiError } from "./client";
import {
  getSuccessData,
  isRecord,
  readBoolean,
  readNullableString,
  readNumber,
  readString,
  readStringArray,
} from "./response";

describe("mobile API response helpers", () => {
  it("guards plain response objects", () => {
    expect(isRecord({ success: true })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
  });

  it("returns success data and throws API errors for invalid payloads", () => {
    expect(getSuccessData({ success: true, data: { id: "item-1" } }, "Invalid")).toEqual({
      id: "item-1",
    });

    expect(() => getSuccessData({ success: false, error: "Nope" }, "Invalid")).toThrow(ApiError);
    expect(() => getSuccessData({ ok: true }, "Invalid")).toThrow("Invalid");
  });

  it("reads primitive values with safe fallbacks", () => {
    expect(readString("milk")).toBe("milk");
    expect(readString(1, "fallback")).toBe("fallback");
    expect(readNullableString("")).toBeNull();
    expect(readNullableString("fridge")).toBe("fridge");
    expect(readNumber(3, 0)).toBe(3);
    expect(readNumber(Number.NaN, 0)).toBe(0);
    expect(readBoolean(true)).toBe(true);
    expect(readStringArray(["a", 2, "b"])).toEqual(["a", "b"]);
  });
});
