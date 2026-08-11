import { test, expect, type Browser, type Page } from "@playwright/test";

const PASSWORD = "Demo@2026";

test.setTimeout(90_000);

const ROLES: {
  role: string;
  email: string;
  url: string;
  accessSelector: string;
}[] = [
  {
    role: "admin",
    email: "demo.admin@allotechno.africa",
    url: "/admin",
    accessSelector: '[data-tour="admin-content"]',
  },
  {
    role: "staff",
    email: "demo.staff@allotechno.africa",
    url: "/admin/dossiers",
    accessSelector: '[data-tour="admin-filters"]',
  },
  {
    role: "technicien",
    email: "demo.tech@allotechno.africa",
    url: "/admin/dossiers",
    accessSelector: '[data-tour="admin-filters"]',
  },
  {
    role: "client",
    email: "demo.client@allotechno.africa",
    url: "/mon-compte",
    accessSelector: '[data-tour="account-tabs"]',
  },
  {
    role: "b2b",
    email: "demo.b2b@allotechno.africa",
    url: "/app",
    accessSelector: '[data-tour="app-header"]',
  },
];

async function login(page: Page, email: string) {
  await page.goto("/auth");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.locator('button:has-text("Se connecter")').click();
  await expect(page).toHaveURL(/\/mon-compte/, { timeout: 30_000 });
}

for (const item of ROLES) {
  test(`${item.role} se connecte et accède à ${item.url}`, async ({ browser }: { browser: Browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await login(page, item.email);
      await page.goto(item.url);
      await expect(page.locator(item.accessSelector)).toBeVisible({ timeout: 20_000 });
      await expect(page).not.toHaveURL(/\/auth/);
    } finally {
      await ctx.close();
    }
  });
}

test("client se voit refuser l'accès admin", async ({ browser }: { browser: Browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await login(page, "demo.client@allotechno.africa");
    await page.goto("/admin");
    await expect(page.getByText("Accès réservé au personnel")).toBeVisible({ timeout: 20_000 });
  } finally {
    await ctx.close();
  }
});
