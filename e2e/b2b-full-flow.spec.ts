import { test, expect } from "@playwright/test";

test.describe("B2B Full Journey & Enterprise Features", () => {
  test("enterprises landing page and multi-step SLA form work smoothly", async ({ page }) => {
    await page.goto("/fr/entreprises");

    // Vérification du titre principal
    await expect(page.locator("h1")).toBeVisible({ timeout: 15_000 });

    // Le formulaire B2B doit afficher la première étape pré-sélectionnée
    const b2bForm = page.locator("#b2b-form");
    await expect(b2bForm).toBeVisible();

    // Vérification du bouton d'étape 1
    const nextBtn = page.getByRole("button", { name: /détails du parc/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Étape 2 : Vérification de la transition
    await expect(page.getByText(/Étape 2/i)).toBeVisible();
  });

  test("organization overview renders SLA Analytics Dashboard and KPI cards", async ({ page }) => {
    await page.goto("/app/organizations/demo-oragroup");

    // Vérification de la présence du dashboard analytique
    await expect(page.getByText(/Performance SLA/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/MTTR/i)).toBeVisible();
    await expect(page.getByText(/Disponibilité Parc/i)).toBeVisible();
  });

  test("organization billing page displays ESG report download button", async ({ page }) => {
    await page.goto("/app/organizations/demo-oragroup/billing");

    // Vérification du badge RSE et du bouton PDF
    await expect(page.getByText(/Bilan Carbone & Impact RSE/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Télécharger Rapport PDF/i })).toBeVisible();
  });
});
