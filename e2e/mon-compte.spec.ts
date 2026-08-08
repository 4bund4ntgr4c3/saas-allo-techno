import { test, expect } from "@playwright/test";

test.describe("Mon compte page", () => {
  test("page redirects to auth when not logged in", async ({ page }) => {
    await page.goto("/fr/mon-compte");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("redirects to auth from /en too", async ({ page }) => {
    await page.goto("/en/mon-compte");
    await expect(page).toHaveURL(/\/auth/);
  });
});
