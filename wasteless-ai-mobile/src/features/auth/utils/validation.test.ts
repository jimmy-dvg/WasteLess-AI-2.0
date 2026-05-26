import { describe, expect, it } from "vitest";
import { hasFormErrors, validateLoginForm, validateRegisterForm } from "./validation";

describe("auth form validation", () => {
  it("requires a valid email and password for login", () => {
    expect(validateLoginForm("", "")).toEqual({
      email: "Email is required.",
      password: "Password is required.",
    });

    expect(validateLoginForm("bad-email", "secret")).toEqual({
      email: "Enter a valid email address.",
    });

    expect(validateLoginForm("ada@example.com", "secret")).toEqual({});
  });

  it("validates registration name and password length", () => {
    expect(validateRegisterForm("A", "ada@example.com", "short")).toEqual({
      name: "Name must be at least 2 characters.",
      password: "Password must be at least 8 characters.",
    });

    expect(validateRegisterForm("Ada Lovelace", "ada@example.com", "longsecret")).toEqual({});
  });

  it("detects forms with any error message", () => {
    expect(hasFormErrors({ email: undefined, password: "" })).toBe(false);
    expect(hasFormErrors({ email: "Required" })).toBe(true);
  });
});
