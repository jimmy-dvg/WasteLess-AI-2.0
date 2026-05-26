import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
  setSessionCookie: vi.fn(),
  isJwtSecretMissingError: vi.fn(),
}));

vi.mock("@/features/auth/auth.service", () => ({
  loginWithPassword: mocks.loginWithPassword,
}));

vi.mock("@/features/auth/session-cookie", () => ({
  setSessionCookie: mocks.setSessionCookie,
}));

vi.mock("@/lib/jwt-secret", () => ({
  isJwtSecretMissingError: mocks.isJwtSecretMissingError,
}));

import { POST } from "./route";

function loginRequest(body: unknown) {
  return new Request("http://test.local/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  it("returns validation errors for invalid payloads", async () => {
    const response = await POST(loginRequest({ email: "not-email", password: "" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: "Enter a valid email address",
    });
    expect(mocks.loginWithPassword).not.toHaveBeenCalled();
  });

  it("returns the auth service failure status", async () => {
    mocks.loginWithPassword.mockResolvedValueOnce({
      success: false,
      error: "Invalid email or password",
      status: 401,
    });

    const response = await POST(loginRequest({ email: "ada@example.com", password: "secret" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: "Invalid email or password",
    });
  });

  it("normalizes email and sets the session cookie on success", async () => {
    const user = { id: "user-1", email: "ada@example.com", name: "Ada Lovelace" };
    mocks.loginWithPassword.mockResolvedValueOnce({
      success: true,
      user,
      token: "signed-token",
    });

    const response = await POST(loginRequest({ email: " ADA@EXAMPLE.COM ", password: "secret" }));

    expect(response.status).toBe(200);
    expect(mocks.loginWithPassword).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "secret",
    });
    expect(mocks.setSessionCookie).toHaveBeenCalledWith(response, "signed-token");
    expect(await response.json()).toEqual({
      success: true,
      data: { user, token: "signed-token" },
    });
  });
});
