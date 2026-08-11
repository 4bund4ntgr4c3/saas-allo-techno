import * as Sentry from "@sentry/react";

const DSN = import.meta.env["VITE_SENTRY_DSN"] as string | undefined;

export function initSentry() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 0.5 : 1,
    environment: import.meta.env.MODE,
  });
}

export { Sentry };
