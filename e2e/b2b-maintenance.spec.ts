import { test, expect } from "@playwright/test";

test.describe("B2B Organization Portal - Billing & Maintenance", () => {
  test("organization billing subroute opens in demo mode without auth", async ({ page }) => {
    await page.goto("/app/organizations/fake-org-id/billing");
    await expect(page.getByText("Organisation Active").first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test("organization maintenance subroute opens in demo mode without auth", async ({ page }) => {
    await page.goto("/app/organizations/fake-org-id/maintenance");
    await expect(page.getByText("Organisation Active").first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page).not.toHaveURL(/\/auth/);
  });
});
