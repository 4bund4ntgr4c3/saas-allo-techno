import { test, expect } from "@playwright/test";

test.describe("Admin page", () => {
  test("page requires auth and redirects to /auth", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("en admin also redirects to auth", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page).toHaveURL(/\/auth/);
  });
});
