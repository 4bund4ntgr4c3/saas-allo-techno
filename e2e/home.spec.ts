import { test, expect } from "@playwright/test";

test("homepage redirects to /fr and renders hero + footer", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);

  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toBeVisible();
  await expect(h1).toContainText(/répar|aujourd/i);

  await expect(page.locator("footer")).toContainText("Abomey-Calavi");
});

test("english homepage renders an h1", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
