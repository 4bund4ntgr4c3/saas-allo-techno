import { test, expect } from "@playwright/test";

test.describe("B2B Organization Portal - Billing & Maintenance", () => {
  test("organization billing subroute redirects unauthenticated users to auth", async ({
    page,
  }) => {
    await page.goto("/app/organizations/fake-org-id/billing");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("organization maintenance subroute redirects unauthenticated users to auth", async ({
    page,
  }) => {
    await page.goto("/app/organizations/fake-org-id/maintenance");
    await expect(page).toHaveURL(/\/auth/);
  });
});
