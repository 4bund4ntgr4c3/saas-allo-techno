import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  CalendarCheck,
  Camera,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CtaBand, MobileMoneyBar } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/engagements";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/engagements")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/engagements";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "engagements.meta.title") },
        { name: "description", content: translate(locale, "engagements.meta.description") },
        { property: "og:title", content: translate(locale, "engagements.meta.og.title") },
        {
          property: "og:description",
          content: translate(locale, "engagements.meta.og.description"),
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: Engagements,
});

const ENGAGEMENT_ICONS: Record<string, LucideIcon> = {
  diagnostic: BadgeCheck,
  price: ReceiptText,
  sameday: CalendarCheck,
  warranty: ShieldCheck,
  photos: Camera,
  listen: MessageCircle,
};

function Engagements() {
  const { locale, t } = useI18n();
  const cards = [
    { icon: "diagnostic", title: t("engagements.card1.title"), text: t("engagements.card1.text") },
    { icon: "price", title: t("engagements.card2.title"), text: t("engagements.card2.text") },
    { icon: "sameday", title: t("engagements.card3.title"), text: t("engagements.card3.text") },
    { icon: "warranty", title: t("engagements.card4.title"), text: t("engagements.card4.text") },
    { icon: "photos", title: t("engagements.card5.title"), text: t("engagements.card5.text") },
    { icon: "listen", title: t("engagements.card6.title"), text: t("engagements.card6.text") },
  ];

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("engagements.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("engagements.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("engagements.hero")}</p>
          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => {
              const Icon = ENGAGEMENT_ICONS[c.icon] ?? BadgeCheck;
              return (
                <article key={c.icon} className="flex flex-col bg-card p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="size-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <h2 className="mt-4 text-base font-bold tracking-tight">{c.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button asChild variant="technical" size="lg">
              <Link to="/$locale/reparations" params={{ locale }}>
                {t("engagements.cta")}
              </Link>
            </Button>
            <p className="max-w-md text-sm text-muted-foreground">{t("engagements.cta.hint")}</p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
