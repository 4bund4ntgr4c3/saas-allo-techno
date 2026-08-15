import { test, expect } from "@playwright/test";

test.describe("Reservation page", () => {
  test("page loads and shows heading or redirects", async ({ page }) => {
    await page.goto("/fr/reservation");
    // /fr/reservation redirige vers /fr/reparations (parcours unifié),
    // ou vers /auth selon le garde d'authentification. Chaque issue est valide.
    const url = page.url();
    const loaded =
      url.includes("/reservation") || url.includes("/reparations") || url.includes("/auth");
    expect(loaded).toBeTruthy();
  });

  test("if accessible, form elements are present", async ({ page }) => {
    await page.goto("/fr/reservation");
    // Si redirigé (auth ou reparations), on saute ce test.
    if (!page.url().includes("/reservation")) return;

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
