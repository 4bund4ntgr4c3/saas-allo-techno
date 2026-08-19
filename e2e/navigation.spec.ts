import { test, expect } from "@playwright/test";

test.setTimeout(90_000);

test("navigation header links work", async ({ page }) => {
  await page.goto("/fr");

  const nav = page.locator("nav").first();
  await expect(nav).toBeVisible();

  const links = nav.getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);

  let checked = 0;
  for (let i = 0; i < count && checked < 3; i++) {
    const link = links.nth(i);
    const href = await link.getAttribute("href");
    if (href && href.startsWith("/fr/")) {
      const url = new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      await Promise.all([page.waitForURL(url, { timeout: 15_000 }), link.click()]);
      await page.goBack();
      await page.waitForLoadState("domcontentloaded");
      checked++;
    }
  }
});

test("homepage footer has key sections", async ({ page }) => {
  await page.goto("/fr");
  const footer = page.locator("footer");
  await expect(footer).toBeVisible();
  await expect(footer).toContainText("Abomey-Calavi");
  await expect(footer).toContainText("Réparations & SAV");
  await expect(footer).toContainText("Solutions Entreprises");
});

test("language switch works", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
