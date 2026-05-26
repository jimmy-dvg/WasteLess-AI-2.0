import { expect, test } from "@playwright/test";

test("home page renders the main WasteLessAI workflows", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "WasteLessAI", exact: true })).toBeVisible();
  await expect(page.getByText("AI household waste assistant")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jump straight into the app" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start free/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Scan products/i }).first()).toBeVisible();
});

test("auth screens expose login and registration forms", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  await page.goto("/register");

  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toBeVisible();
});

test("protected dashboard routes redirect anonymous users to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("inventory API requires authentication", async ({ request }) => {
  const response = await request.get("/api/inventory");

  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ success: false, error: "Unauthorized" });
});
