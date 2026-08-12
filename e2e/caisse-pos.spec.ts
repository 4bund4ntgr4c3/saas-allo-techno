import { test, expect } from "@playwright/test";

test.describe("Admin Caisse & POS", () => {
  test("caisse route redirects unauthenticated users to auth", async ({ page }) => {
    await page.goto("/admin/caisse");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("livraisons route redirects unauthenticated users to auth", async ({ page }) => {
    await page.goto("/admin/livraisons");
    await expect(page).toHaveURL(/\/auth/);
  });
});
