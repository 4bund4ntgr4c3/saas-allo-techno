import { createFileRoute } from "@tanstack/react-router";
import { COMPANY } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/mentions-legales")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/mentions-legales";
    return {
      meta: [
        { title: translate(locale, "mentions.meta.title") },
        { name: "description", content: translate(locale, "mentions.meta.description") },
        { property: "og:title", content: translate(locale, "mentions.og.title") },
        { property: "og:description", content: translate(locale, "mentions.og.description") },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "index, follow" },
      ],
      links: [...localeSeo(locale, suffix).links],
    };
  },
  component: Mentions,
});

function Mentions() {
  const { locale, t } = useI18n();
  const SECTIONS = [
    {
      t: t("mentions.editor.t"),
      p: [
        t("mentions.editor.p0", [COMPANY.name]),
        t("mentions.editor.p1", [COMPANY.address]),
        t("mentions.editor.p2", [COMPANY.phone, COMPANY.email]),
      ],
    },
    {
      t: t("mentions.hosting.t"),
      p: [t("mentions.hosting.p0")],
    },
    {
      t: t("mentions.ip.t"),
      p: [t("mentions.ip.p0"), t("mentions.ip.p1")],
    },
    {
      t: t("mentions.data.t"),
      p: [t("mentions.data.p0"), t("mentions.data.p1", [COMPANY.email]), t("mentions.data.p2")],
    },
    {
      t: t("mentions.service.t"),
      p: [t("mentions.service.p0"), t("mentions.service.p1"), t("mentions.service.p2")],
    },
  ];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <span className="at-eyebrow mb-4 block">{t("mentions.eyebrow")}</span>
        <h1 className="at-display text-4xl md:text-5xl">{t("mentions.title")}</h1>
        <div className="mt-12 space-y-12">
          {SECTIONS.map((s) => (
            <div key={s.t} className="border-t border-border pt-8">
              <h2 className="at-display text-xl">{s.t}</h2>
              <div className="mt-4 space-y-3">
                {s.p.map((par) => (
                  <p
                    key={par.slice(0, 30)}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {par}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-12 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("mentions.updated")}
          {new Date().toLocaleDateString(locale)}
        </p>
      </div>
    </section>
  );
}
