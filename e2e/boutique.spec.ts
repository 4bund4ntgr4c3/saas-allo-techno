import { test, expect } from "@playwright/test";

test("shop page renders heading, search box and a product listing", async ({ page }) => {
  await page.goto("/fr/boutique");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Accessoires");
  await expect(page.getByLabel("Recherche", { exact: true })).toBeVisible();

  const firstProduct = page.locator("article").first();
  await expect(firstProduct).toBeVisible();
});
