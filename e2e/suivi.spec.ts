import { test, expect } from "@playwright/test";

test.describe("Suivi (tracking) page", () => {
  test("page loads with heading visible", async ({ page }) => {
    await page.goto("/fr/suivi");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Où en est ma réparation");
  });

  test("lookup form is visible with reference and tracking inputs", async ({ page }) => {
    await page.goto("/fr/suivi");
    await expect(page.getByLabel("Numéro de dossier")).toBeVisible();
    await expect(page.getByLabel("Code de suivi")).toBeVisible();
  });

  test("submitting empty form shows validation", async ({ page }) => {
    await page.goto("/fr/suivi");
    await page.getByRole("button", { name: "Vérifier" }).click();
    await expect(page.getByRole("alert")).toContainText("Saisissez votre code de suivi");
  });

  test("reference input accepts text", async ({ page }) => {
    await page.goto("/fr/suivi");
    const refInput = page.getByLabel("Numéro de dossier");
    await refInput.fill("AT-1234");
    await expect(refInput).toHaveValue("AT-1234");
  });

  test("tracking code input accepts text", async ({ page }) => {
    await page.goto("/fr/suivi");
    const codeInput = page.getByLabel("Code de suivi");
    await codeInput.fill("ABC123");
    await expect(codeInput).toHaveValue("ABC123");
  });
});
