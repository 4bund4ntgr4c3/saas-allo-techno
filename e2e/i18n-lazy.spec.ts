import { test, expect, type Page } from "@playwright/test";

const PASSWORD = "Demo@2026";

async function login(page: Page, email: string) {
  await page.goto("/auth");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.locator('button:has-text("Se connecter")').click();
  await expect(page).toHaveURL(/\/mon-compte/, { timeout: 30_000 });
}

test("admin: lazy segment admin traduit (pas de cles brutes)", async ({ page }) => {
  await login(page, "demo.admin@allotechno.africa");
  await page.goto("/admin");
  await expect(page.getByText("Tableau de bord", { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  const body = await page.textContent("body");
  expect(body).toContain("Général");
  expect(body).not.toContain("admin.access.title");
});

test("client: lazy segment mon-compte traduit", async ({ page }) => {
  await login(page, "demo.client@allotechno.africa");
  await page.goto("/mon-compte");
  await expect(page.getByText("Mes dossiers", { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  const body = await page.textContent("body");
  expect(body).not.toContain("mc.tab.dossiers");
});

test("b2b: lazy segment org traduit", async ({ page }) => {
  await login(page, "demo.b2b@allotechno.africa");
  await page.goto("/app");
  await expect(page.getByText("Aperçu Général", { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  const body = await page.textContent("body");
  expect(body).not.toContain("org.equipment.form.brand");
});
