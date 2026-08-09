import { createFileRoute } from "@tanstack/react-router";
import { CtaBand } from "@/components/site/Blocks";
import { useI18n } from "@/lib/i18n/context";
import { normalizeLocale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";
import { translate } from "@/lib/i18n/dictionaries";
import "@/lib/i18n/segments/changelog";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/changelog")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/changelog";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "changelog.meta.title") },
        { name: "description", content: translate(locale, "changelog.meta.description") },
        { property: "og:title", content: translate(locale, "changelog.meta.og.title") },
        { property: "og:description", content: translate(locale, "changelog.meta.og.description") },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: ChangelogPage,
});

interface ChangelogEntry {
  version: string;
  date: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
  removed?: string[];
}

const ENTRIES: ChangelogEntry[] = [
  {
    version: "2026.08.09",
    date: "2026-08-09",
    added: [
      "Password reset flow (forgot → email → update)",
      "Auth page fully translated FR/EN (27 keys)",
      "404 page + ErrorComponent translated FR/EN",
      "Admin refactor: 5131 → 872 lines (-83%), 14 tab components extracted",
      "Refund flow: server functions + admin tab with confirmation dialog",
      "Push notifications server: /api/push-subscribe endpoint + VAPID dispatch",
      "Audit log: audit_log table, logAudit/getAuditLogs functions",
      "Webhook retry: exponential backoff for payment webhooks",
      "Blog i18n: BilingualPost exported, FR/EN translations",
    ],
    fixed: [
      "mon-compte: hooks reordered (useServerFn before useQuery), unused imports removed",
      "webhook-retry: unused WebhookAttempt interface and retryQueue removed",
      'vite.config.ts: process.env["ANALYZE"] bracket notation (TS4111)',
      "audit.ts: entity_id accepts string | null (exactOptionalPropertyTypes)",
      "admin.tsx: AuditSection uses useI18n() for translations",
      "Type safety: 15+ as never/as any casts removed",
    ],
  },
  {
    version: "2026.08.08",
    date: "2026-08-08",
    added: [
      "17 database performance indexes",
      "AuthErrorHandler: session expiry detection with toast + redirect",
      "KV rate limiting documentation (Cloudflare Workers)",
      "Deposit payment (50% acompte) for reservations",
      "Extended warranty (12 months, +15% of price)",
      "Usable loyalty points (100pts = 500 FCFA)",
      "Push notification toggle (client-side)",
      "CI/CD: GitHub Actions (lint + test + build + deploy + backup)",
      "Cloudflare monitoring (trackMetric + MetricsPanel)",
      "Supabase backup script + weekly workflow",
      "ErrorBoundary component + errorComponent on routes",
      "Lazy loading StatsDashboard (React.lazy + Suspense)",
      "Accessibility: aria-labels Footer, skip-to-content",
      "6 E2E test files (suivi, reservation, mon-compte, admin)",
      "Dynamic sitemap (/api/sitemap)",
      "Structured logging (createLogger)",
      "Image optimization (lazy + async)",
      "Plausible Analytics",
      "Offline mode (SW v2 + offline.html + OfflineIndicator)",
      "API docs (/api/docs)",
    ],
  },
  {
    version: "2026.08.07",
    date: "2026-08-07",
    added: [
      "Mon-compte tabs: Loyalty, Referral, Reviews, Profile (6 tabs total)",
      "Server functions: listCustomerReviews, listCustomerPayments, getLoyaltySummary",
      "i18n segment mon-compte: 6 tabs FR/EN",
      "Payment history export CSV + low stock alerts",
    ],
  },
  {
    version: "2026.08.06",
    date: "2026-08-06",
    added: [
      "FedaPay/KKiaPay payment providers (2 additional Mobile Money)",
      "WhatsApp auto-reminders: confirmation, status change, rescheduling",
      "Verified customer reviews: moderation system (publish/hide)",
      "Workshop kanban: drag-and-drop board for repair statuses",
      "Advanced KPIs: revenue, conversion, average duration per stage",
      "Structured data SEO: Schema.org LocalBusiness",
    ],
  },
  {
    version: "2026.08.05",
    date: "2026-08-05",
    added: [
      "Neighborhood pages: index + slug pages for each Abomey-Calavi neighborhood",
      "Online quote payment: Flutterwave for approved quotes",
      "Returns management: tracking of part/repair returns",
      "Admin catalog: CRUD brands, categories, devices, faults, photos",
      "Local SEO: neighborhood pages, Google Maps, business hours",
    ],
  },
  {
    version: "2026.08.04",
    date: "2026-08-04",
    added: [
      "Consoles and games: PS4, PS5, Xbox, Switch in catalog",
      "Repair guides: maintenance and troubleshooting articles",
      "Warranty claims: ticket system with statuses",
      "Commitments page: service promises",
      "Refurbished devices: refurbished device catalog",
    ],
  },
  {
    version: "2026.08.03",
    date: "2026-08-03",
    added: [
      "Quote workflow: complete devis → approval → payment",
      "Tracking photos: upload per stage (diagnosis, parts, repair)",
      "Extended warranty: 6/12 month options with pricing",
      "Student/teacher promo: special discounts",
      "Complementary services: backup, data recovery",
      "Store locations: workshop location pages",
    ],
  },
  {
    version: "2026.08.02",
    date: "2026-08-02",
    added: [
      "Online payment: Flutterwave (MTN MoMo, Moov Money, Celtiis)",
      "Loyalty program: points, tiers (Bronze/Silver/Gold), referrals",
      "Home delivery: status tracking (scheduled → in transit → delivered)",
      "Admin statistics: Recharts interactive charts",
      "SEO: meta tags, Open Graph, Twitter Cards, sitemap",
      "PWA: manifest, service worker, installable",
      "E2E tests: Playwright for main flows",
    ],
  },
  {
    version: "2026.08.01",
    date: "2026-08-01",
    added: [
      "Security: secret tracking code, 2FA server, private uploads, rate limiting",
      "Extended catalog: Samsung 263, HP 350, Apple 142, appliances",
      "Admin staff: role management, leads, tests",
      "i18n: bilingual routing /fr /en across entire site",
      "Bundle perf: DEVICES extracted from initial bundle, security headers",
      "Monitoring: /api/healthz endpoint",
      "Env conventions: .env.example documented",
    ],
  },
  {
    version: "2026.07.31",
    date: "2026-07-31",
    added: [
      "Migration Lovable → Cloudflare Workers: standalone build, wrangler, custom domain",
      "Supabase config: new project, .env excluded from git, sb_publishable_/sb_secret_ keys",
      "References: adaptive padding AT-YYYY-XXXX beyond 9999",
      "Fault factory: centralized in types.ts, removed 16 helper copies",
      "Quick wins: quote by name, aligned hours, absolute canonicals/OG, dead code removed",
    ],
  },
  {
    version: "2026.07.30",
    date: "2026-07-30",
    added: [
      "9-step reservation: type → brand → series → family → model → faults → slot → photos → contact",
      "Rescheduling: modify slot after booking",
      "Global search: cmdk + SearchModal with autocomplete",
      "Catalog: pages per brand with detailed device sheets",
    ],
  },
  {
    version: "2026.07.29",
    date: "2026-07-29",
    added: [
      "Admin dashboard: status management screen",
      "Tracking: repair status page by reference number",
      "Accessories shop: catalog with cart",
      "Design system: base UI components (shadcn/ui)",
      "Brand pages: SEO pages per brand",
    ],
  },
  {
    version: "2026.07.28",
    date: "2026-07-28",
    added: [
      "Initial project: TanStack Start template",
      "Base pages: home, repairs, contact, pricing",
      "Online booking: diagnostic wizard",
      "Admin: initial management screen",
      "Tracking: repair status tracker",
    ],
  },
];

function ChangelogPage() {
  const { t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("changelog.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("changelog.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("changelog.subtitle")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="space-y-12">
            {ENTRIES.map((entry) => (
              <article key={entry.version} className="border-b border-border pb-12 last:border-b-0">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h2 className="text-2xl font-bold tracking-tight">{entry.version}</h2>
                  <time dateTime={entry.date} className="font-mono text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("fr-BJ", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </div>

                <div className="mt-6 space-y-6">
                  {entry.added && entry.added.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-success">
                        {t("changelog.added")}
                      </h3>
                      <ul className="space-y-1">
                        {entry.added.map((item) => (
                          <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.changed && entry.changed.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                        {t("changelog.changed")}
                      </h3>
                      <ul className="space-y-1">
                        {entry.changed.map((item) => (
                          <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.fixed && entry.fixed.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                        {t("changelog.fixed")}
                      </h3>
                      <ul className="space-y-1">
                        {entry.fixed.map((item) => (
                          <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.removed && entry.removed.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-destructive">
                        {t("changelog.removed")}
                      </h3>
                      <ul className="space-y-1">
                        {entry.removed.map((item) => (
                          <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
