import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, Loader2, Phone, ShieldCheck } from "lucide-react";
import { CtaBand } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/data/catalog/company";
import { submitWarrantyClaim } from "@/lib/claims.functions";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/reclamation")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/reclamation");
    return {
      meta: [
        { title: translate(locale, "reclamation.meta.title") },
        { name: "description", content: translate(locale, "reclamation.meta.description") },
        { property: "og:title", content: translate(locale, "reclamation.meta.og.title") },
        {
          property: "og:description",
          content: translate(locale, "reclamation.meta.og.description"),
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: Reclamation,
});

const field =
  "h-10 w-full border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const label = "at-eyebrow mb-1 block";

function Reclamation() {
  const { t } = useI18n();
  const claim = useServerFn(submitWarrantyClaim);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    reservation_reference: "",
    device: "",
    message: "",
  });
  const [claimError, setClaimError] = useState<string | null>(null);

  const submission = useMutation({
    mutationFn: async () => {
      setClaimError(null);
      const { reference } = await claim({
        data: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          reservation_reference: form.reservation_reference.trim().toUpperCase(),
          device: form.device.trim(),
          message: form.message.trim(),
        },
      });
      return reference;
    },
    onError: (err: unknown) =>
      setClaimError(err instanceof Error ? err.message : t("reclamation.error.generic")),
  });

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const reference = submission.data;

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("reclamation.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("reclamation.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("reclamation.hero")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {reference ? (
            <div
              role="status"
              className="mx-auto max-w-xl border border-success/40 bg-success/10 p-8 text-center"
            >
              <CheckCircle2 className="mx-auto size-10 text-success" />
              <p className="at-eyebrow mt-4 text-success">{t("reclamation.success.title")}</p>
              <p className="mt-3 font-mono text-2xl font-semibold text-primary">{reference}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("reclamation.success.paragraph", [reference])}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("reclamation.success.whatsapp")}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <form
                className="space-y-4 border border-border bg-card p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  submission.mutate();
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="claim-name">
                      {t("reclamation.form.label.name")}
                    </label>
                    <input
                      id="claim-name"
                      className={field}
                      value={form.name}
                      onChange={set("name")}
                      placeholder={t("reclamation.form.placeholder.name")}
                      autoComplete="name"
                      required
                      minLength={3}
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="claim-phone">
                      {t("reclamation.form.label.phone")}
                    </label>
                    <input
                      id="claim-phone"
                      className={field}
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder={t("reclamation.form.placeholder.phone")}
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      minLength={8}
                      maxLength={25}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="claim-email">
                      {t("reclamation.form.label.email")}{" "}
                      <span className="font-normal text-muted-foreground">
                        {t("reclamation.form.optional")}
                      </span>
                    </label>
                    <input
                      id="claim-email"
                      className={field}
                      value={form.email}
                      onChange={set("email")}
                      type="email"
                      autoComplete="email"
                      maxLength={180}
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="claim-reference">
                      {t("reclamation.form.label.reservation_reference")}{" "}
                      <span className="font-normal text-muted-foreground">
                        {t("reclamation.form.optional")}
                      </span>
                    </label>
                    <input
                      id="claim-reference"
                      className={`${field} font-mono uppercase`}
                      value={form.reservation_reference}
                      onChange={set("reservation_reference")}
                      placeholder="AT-2026-0034"
                      maxLength={60}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("reclamation.form.hint.reservation_reference")}
                    </p>
                  </div>
                </div>

                <div>
                  <label className={label} htmlFor="claim-device">
                    {t("reclamation.form.label.device")}{" "}
                    <span className="font-normal text-muted-foreground">
                      {t("reclamation.form.optional")}
                    </span>
                  </label>
                  <input
                    id="claim-device"
                    className={field}
                    value={form.device}
                    onChange={set("device")}
                    placeholder={t("reclamation.form.placeholder.device")}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className={label} htmlFor="claim-message">
                    {t("reclamation.form.label.message")}
                  </label>
                  <textarea
                    id="claim-message"
                    className="h-32 w-full border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={form.message}
                    onChange={set("message")}
                    placeholder={t("reclamation.form.placeholder.message")}
                    required
                    minLength={10}
                    maxLength={2000}
                  />
                </div>

                {claimError && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{claimError}</span>
                  </div>
                )}

                <Button type="submit" variant="technical" disabled={submission.isPending}>
                  {submission.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {submission.isPending ? t("reclamation.pending") : t("reclamation.submit")}
                </Button>
              </form>

              <aside className="h-fit border border-border bg-card p-6">
                <ShieldCheck className="size-6 text-primary" strokeWidth={1.5} />
                <h2 className="mt-3 text-base font-bold tracking-tight">
                  {t("reclamation.what.title")}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("reclamation.what.standard")}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("reclamation.what.contact")}
                </p>
                <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm">
                  <Phone className="size-4 text-primary" />
                  {COMPANY.phone}
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
