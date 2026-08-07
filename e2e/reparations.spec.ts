import { test, expect } from "@playwright/test";

test("repair wizard renders heading and device search", async ({ page }) => {
  await page.goto("/fr/reparations");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByLabel("Rechercher un appareil")).toBeVisible();
});

test("device search shows suggestions and advances the wizard", async ({ page }) => {
  await page.goto("/fr/reparations");

  const search = page.getByLabel("Rechercher un appareil");
  const dropdown = page.locator("ul.absolute");

  await expect
    .poll(
      async () => {
        await search.fill("iPhone");
        return (await dropdown.count()) > 0;
      },
      { timeout: 15_000 },
    )
    .toBe(true);

  await dropdown.getByRole("button").first().click();

  await expect(page.getByRole("button", { name: "Choisir un créneau" })).toBeVisible();
});
