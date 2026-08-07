import { test, expect } from "@playwright/test";

test("tracking page shows heading and dossier field", async ({ page }) => {
  await page.goto("/fr/suivi");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Où en est ma réparation");
  await expect(page.getByLabel("Numéro de dossier")).toBeVisible();
});

test("submitting an empty form shows the validation message", async ({ page }) => {
  await page.goto("/fr/suivi");
  await page.getByRole("button", { name: "Vérifier" }).click();
  await expect(page.getByRole("alert")).toContainText("Saisissez votre code de suivi");
});
