import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, getApiErrorMessage } from "./client";

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

describe("mobile API client", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test/";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    vi.unstubAllGlobals();
  });

  it("requires the Expo API URL to be configured", async () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    await expect(apiRequest("/api/inventory")).rejects.toMatchObject({
      message: "EXPO_PUBLIC_API_URL is not configured.",
      status: 0,
    });
  });

  it("sends JSON requests with auth and custom headers", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 })
    );

    const payload = await apiRequest("/api/inventory", {
      method: "POST",
      authToken: "token-123",
      headers: { "X-Test": "yes" },
      body: JSON.stringify({ name: "Milk" }),
    });

    expect(payload).toEqual({ success: true, data: { ok: true } });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/inventory",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("X-Test")).toBe("yes");
  });

  it("surfaces structured API errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: "Inventory unavailable" }), {
        status: 503,
      })
    );

    await expect(apiRequest("/api/inventory")).rejects.toMatchObject({
      message: "Inventory unavailable",
      status: 503,
    });
  });

  it("normalizes unknown errors for UI messages", () => {
    expect(getApiErrorMessage(new ApiError("No network", 0))).toBe("No network");
    expect(getApiErrorMessage(new Error("Boom"))).toBe("Boom");
    expect(getApiErrorMessage(null, "Fallback")).toBe("Fallback");
  });
});
