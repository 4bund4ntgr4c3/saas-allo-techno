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
import { initSentry } from "@/lib/sentry";
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

initSentry();

// Lazy-load components that could crash at import time (zustand, etc.)
// Without lazy, an import failure in these kills the entire root ? I18nProvider never renders.
const CompareBar = lazy(() =>
  import("@/components/shop/CompareBar").then((m) => ({ default: m.CompareBar })),
);
const CookieConsent = lazy(() =>
  import("@/components/site/CookieConsent").then((m) => ({ default: m.CookieConsent })),
);

// La modal de recherche est lourde (catalogue + cmdk) : on la charge en lazy
// pour ne pas l'inclure dans le bundle du premier rendu. Elle sera charg�e
// juste avant/sur le premier besoin (voir RootComponent).
const SearchModal = lazy(() =>
  import("@/components/site/SearchModal").then((m) => ({ default: m.SearchModal })),
);

function NotFoundComponent() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="at-display text-7xl">404</h1>
        <h2 className="mt-4 text-xl font-bold tracking-tight">{t("error.notFound.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("error.notFound.description")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-primary px-5 py-3 text-sm font-extrabold uppercase tracking-widest text-primary-foreground"
          >
            {t("error.notFound.backToHome")}
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
          {isAuthError ? t("error.sessionExpired") : t("error.generic")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isAuthError ? t("error.redirectingToLogin") : t("error.couldNotLoad")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {isAuthError ? (
            <a
              href="/auth"
              className="rounded-sm bg-primary px-5 py-3 text-sm font-extrabold uppercase tracking-widest text-primary-foreground"
            >
              {t("auth.login")}
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
                {t("error.retry")}
              </button>
              <a
                href="/"
                className="rounded-sm border border-border px-5 py-3 text-sm font-bold uppercase tracking-widest"
              >
                {t("error.notFound.backToHome")}
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
      { title: "All� Techno � R�paration d'appareils � Abomey-Calavi" },
      {
        name: "description",
        content:
          "R�paration de smartphones, tablettes, MacBook, iMac, consoles et montres connect�es � Abomey-Calavi, B�nin.",
      },
      { property: "og:site_name", content: "All� Techno" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${COMPANY.url}/og-image.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${COMPANY.url}/og-image.png` },
      { name: "theme-color", content: "#d83100" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "All� Techno" },
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
            "Atelier de r�paration de smartphones, tablettes, ordinateurs, consoles et montres connect�es.",
          telephone: COMPANY.phone,
          email: COMPANY.email,
          priceRange: "3.500 - 195.000 FCFA",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Quartier Zogbadj�, Rue de l'Universit�",
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
  // La langue SSR suit le premier segment d'URL (/fr, /en) ; sinon fran�ais.
  const lang = useRouterState({ select: (s) => s.location.pathname.split("/")[1] ?? "fr" });
  const locale = normalizeLocale(lang);
  return (
    <html lang={lang === "en" ? "en" : "fr"}>
      <head>
        <HeadContent />
        <script defer data-domain="allotechno.africa" src="https://plausible.io/js/script.js" />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = /^\/(en\/)?admin/.test(pathname);

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
          <a
            href="#contenu-principal"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-sm focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-extrabold focus:uppercase focus:tracking-widest focus:text-primary-foreground"
          >
            Aller au contenu principal
          </a>
          {!isAdmin && <Header />}
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <main id="contenu-principal" tabIndex={-1} className="focus:outline-none">
            <Outlet />
          </main>
          {!isAdmin && <Footer />}
          {!isAdmin && (
            <Suspense fallback={null}>
              <SearchModal />
            </Suspense>
          )}
          <Toaster />
          {!isAdmin && (
            <>
              <AddToCartWidget />
              <CartDrawer />
              <Suspense fallback={null}>
                <CompareBar />
              </Suspense>
              <PwaInstallBanner />
              <PwaUpdatePrompt />
              <BackToTop />
              <OfflineIndicator />
              <Suspense fallback={null}>
                <CookieConsent />
              </Suspense>
            </>
          )}
          <AuthErrorHandler />
        </WishlistProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}
