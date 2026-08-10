import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, Suspense, lazy, type ReactNode } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/notfound";

import appCss from "../styles.css?url";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { PwaInstallBanner } from "@/components/site/PwaInstallBanner";
import { OfflineIndicator } from "@/components/site/OfflineIndicator";
import { PwaUpdatePrompt } from "@/components/site/PwaUpdatePrompt";
import { BackToTop } from "@/components/site/BackToTop";
import { COMPANY } from "@/data/catalog/company";
import { CartProvider } from "@/components/shop/cart";
import { WishlistProvider } from "@/components/shop/wishlist";
import { AddToCartWidget } from "@/components/shop/AddToCartWidget";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { supabase } from "@/integrations/supabase/client";
import { AuthErrorHandler } from "@/components/AuthErrorHandler";

// La modal de recherche est lourde (catalogue + cmdk) : on la charge en lazy
// pour ne pas l'inclure dans le bundle du premier rendu. Elle sera chargée
// juste avant/sur le premier besoin (voir RootComponent).
const SearchModal = lazy(() =>
  import("@/components/site/SearchModal").then((m) => ({ default: m.SearchModal })),
);

function NotFoundComponent() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="at-display text-7xl">{t("notfound.title")}</h1>
        <h2 className="mt-4 text-xl font-bold tracking-tight">{t("notfound.heading")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("notfound.body")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-3 text-sm font-extrabold uppercase tracking-widest text-primary-foreground"
          >
            {t("notfound.back")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useI18n();

  const isAuthError =
    error.message.toLowerCase().includes("auth") || error.message.toLowerCase().includes("session");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="at-display text-2xl">
          {isAuthError ? t("auth.session.expired") : t("notfound.error")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isAuthError
            ? "Vous allez être redirigé vers la page de connexion."
            : t("notfound.error.body")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {isAuthError ? (
            <a
              href="/auth"
              className="rounded-sm bg-primary px-5 py-3 text-sm font-extrabold uppercase tracking-widest text-primary-foreground"
            >
              {t("nav.connexion")}
            </a>
          ) : (
            <>
              <button
                onClick={() => {
                  router.invalidate();
                  reset();
                }}
                className="rounded-sm bg-primary px-5 py-3 text-sm font-extrabold uppercase tracking-widest text-primary-foreground"
              >
                {t("notfound.retry")}
              </button>
              <a
                href="/"
                className="rounded-sm border border-border px-5 py-3 text-sm font-bold uppercase tracking-widest"
              >
                {t("notfound.home")}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Allô Techno — Réparation d'appareils à Abomey-Calavi" },
      {
        name: "description",
        content:
          "Réparation de smartphones, tablettes, MacBook, iMac, consoles et montres connectées à Abomey-Calavi, Bénin.",
      },
      { property: "og:site_name", content: "Allô Techno" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${COMPANY.url}/og-image.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${COMPANY.url}/og-image.png` },
      { name: "theme-color", content: "#d83100" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Allô Techno" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: COMPANY.name,
          description:
            "Atelier de réparation de smartphones, tablettes, ordinateurs, consoles et montres connectées.",
          telephone: COMPANY.phone,
          email: COMPANY.email,
          priceRange: "3.500 - 195.000 FCFA",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Quartier Zogbadjè, Rue de l'Université",
            addressLocality: COMPANY.city,
            addressCountry: "BJ",
          },
          geo: { "@type": "GeoCoordinates", latitude: COMPANY.lat, longitude: COMPANY.lng },
          openingHours: ["Mo-Fr 08:30-20:30", "Sa 09:00-17:00"],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // La langue SSR suit le premier segment d'URL (/fr, /en) ; sinon français.
  const lang = useRouterState({ select: (s) => s.location.pathname.split("/")[1] ?? "fr" });
  return (
    <html lang={lang === "en" ? "en" : "fr"}>
      <head>
        <HeadContent />
        <script defer data-domain="allotechno.africa" src="https://plausible.io/js/script.js" />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // La locale est portée par le premier segment d'URL (/fr, /en). Pour les
  // chemins hors locale (auth, admin, sitemap…), on retombe sur le navigateur.
  const locale = normalizeLocale(pathname.split("/")[1] ?? "");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  // PWA : enregistrement du service worker (uniquement en production).
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (err) {
        console.error("[pwa] enregistrement du service worker impossible", err);
      }
    };
    void register();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <WishlistProvider>
          <I18nProvider initialLocale={locale}>
            <a
              href="#contenu-principal"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-sm focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-extrabold focus:uppercase focus:tracking-widest focus:text-primary-foreground"
            >
              Aller au contenu principal
            </a>
            <Header />
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <main id="contenu-principal" tabIndex={-1} className="focus:outline-none">
              <Outlet />
            </main>
            <Footer />
            <Suspense fallback={null}>
              <SearchModal />
            </Suspense>
            <Toaster />
            <AddToCartWidget />
            <CartDrawer />
            <PwaInstallBanner />
            <PwaUpdatePrompt />
            <BackToTop />
            <OfflineIndicator />
            <AuthErrorHandler />
          </I18nProvider>
        </WishlistProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}
