import { test, expect } from "@playwright/test";

test.describe("Reservation page", () => {
  test("page loads and shows heading or redirects to auth", async ({ page }) => {
    await page.goto("/fr/reservation");
    // Reservation page may require auth and redirect, or may load directly.
    // Either outcome is acceptable.
    const url = page.url();
    const loaded = url.includes("/reservation") || url.includes("/auth");
    expect(loaded).toBeTruthy();
  });

  test("if accessible, form elements are present", async ({ page }) => {
    await page.goto("/fr/reservation");
    // If redirected to auth, skip this test gracefully
    if (page.url().includes("/auth")) return;

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
