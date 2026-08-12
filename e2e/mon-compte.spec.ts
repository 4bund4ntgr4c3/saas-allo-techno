import { test, expect } from "@playwright/test";

test.describe("Mon compte page", () => {
  test("page redirects to auth when not logged in", async ({ page }) => {
    await page.goto("/mon-compte");
    await expect(page).toHaveURL(/\/auth/);
  });
});
