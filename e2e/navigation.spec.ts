import { test, expect } from "@playwright/test";

test("navigation header links work", async ({ page }) => {
  await page.goto("/fr");

  const nav = page.locator("nav").first();
  await expect(nav).toBeVisible();

  const links = nav.getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < Math.min(count, 5); i++) {
    const link = links.nth(i);
    const href = await link.getAttribute("href");
    if (href && href.startsWith("/fr/")) {
      await link.click();
      await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      await page.goBack();
    }
  }
});

test("homepage footer has key sections", async ({ page }) => {
  await page.goto("/fr");
  const footer = page.locator("footer");
  await expect(footer).toContainText("Abomey-Calavi");
  await expect(footer).toContainText("Services");
});

test("language switch works", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
