import { test, expect } from "@playwright/test";

test.describe("Devis page", () => {
  test("loads and shows heading + 3-step form", async ({ page }) => {
    await page.goto("/fr/devis");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Devis instantané");
    await expect(page.getByLabel("1 · Marque")).toBeVisible();
    await expect(page.getByLabel("2 · Appareil")).toBeVisible();
    await expect(page.getByLabel("3 · Panne")).toBeVisible();
  });

  test("shows empty hint before selection", async ({ page }) => {
    await page.goto("/fr/devis");
    await expect(page.getByText("Complétez les trois champs")).toBeVisible();
  });

  test("device select is disabled until brand is selected", async ({ page }) => {
    await page.goto("/fr/devis");
    await expect(page.getByLabel("2 · Appareil")).toBeDisabled();
  });

  test("selecting a brand enables device dropdown", async ({ page }) => {
    await page.goto("/fr/devis");
    await page.getByLabel("1 · Marque").selectOption("apple");
    await expect(page.getByLabel("2 · Appareil")).toBeEnabled();
  });

  test("shows estimation after full selection", async ({ page }) => {
    await page.goto("/fr/devis");
    await page.getByLabel("1 · Marque").selectOption("apple");

    const deviceSelect = page.getByLabel("2 · Appareil");
    await expect(deviceSelect).toBeEnabled();
    const deviceOptions = await deviceSelect.locator("option").allTextContents();
    const secondOption = deviceOptions[1];
    if (secondOption) {
      await deviceSelect.selectOption({ label: secondOption });
    }

    const faultSelect = page.getByLabel("3 · Panne");
    await expect(faultSelect).toBeEnabled();
    await faultSelect.selectOption({ index: 1 });

    await expect(page.getByText("Estimation")).toBeVisible();
    await expect(page.getByText("Prix tout compris")).toBeVisible();
    await expect(page.getByText("Délai atelier")).toBeVisible();
  });
});

test.describe("Reservation page", () => {
  test("loads and shows heading", async ({ page }) => {
    await page.goto("/fr/reservation");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
