import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { REVIEWS, STEPS } from "@/data/catalog/static";
import { COMPANY, formatFcfa } from "@/data/catalog/company";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function SectionHeader({
  eyebrow,
  title,
  text,
  right,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div className="max-w-xl">
        {eyebrow && <span className="at-eyebrow mb-3 block">{eyebrow}</span>}
        <h2 className="at-display text-3xl md:text-4xl">{title}</h2>
        {text && <p className="mt-4 text-sm text-muted-foreground">{text}</p>}
      </div>
      {right}
    </div>
  );
}

export function ProcessSteps() {
  const { t } = useI18n();
  return (
    <div className="grid gap-px border border-border bg-border md:grid-cols-3">
      {STEPS.map((s) => (
        <div key={s.n} className="bg-card p-8">
          <span className="font-mono text-4xl font-medium text-primary">{s.n}</span>
          <h3 className="mt-6 text-lg font-bold tracking-tight">{t(s.title)}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t(s.text)}</p>
        </div>
      ))}
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-0.5" aria-label={t("blocks.stars", [n])}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < n ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

export function ReviewsGrid({
  limit = 6,
  reviews = REVIEWS,
}: {
  limit?: number;
  reviews?: typeof REVIEWS;
}) {
  return (
    <div className="grid gap-px border border-border bg-border md:grid-cols-3">
      {reviews.slice(0, limit).map((r, i) => (
        <figure key={r.name + i} className="bg-card p-8">
          <Stars n={r.rating} />
          <blockquote className="mt-4 text-sm font-medium italic">« {r.text} »</blockquote>
          <figcaption className="mt-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {r.name} — {r.city} · {r.device}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function MobileMoneyBar() {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-4 border border-border bg-surface p-4">
      <span className="at-eyebrow">{t("blocks.money.payments")}</span>
      <span className="border border-border px-3 py-1 font-mono text-[10px] font-bold uppercase">
        MTN MoMo
      </span>
      <span className="border border-border px-3 py-1 font-mono text-[10px] font-bold uppercase">
        Moov Money
      </span>
      <span className="border border-border px-3 py-1 font-mono text-[10px] font-bold uppercase">
        Celtiis
      </span>
      <span className="border border-border px-3 py-1 font-mono text-[10px] font-bold uppercase">
        {t("blocks.money.cash")}
      </span>
      <span className="border border-border px-3 py-1 font-mono text-[10px] font-bold uppercase">
        {t("blocks.money.b2b")}
      </span>
    </div>
  );
}

export function CtaBand() {
  const { locale, t } = useI18n();
  return (
    <section className="border-t border-border bg-foreground py-16 text-background">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center">
        <div>
          <h2 className="at-display text-3xl">{t("blocks.cta.title")}</h2>
          <p className="mt-3 max-w-lg text-sm text-background/70">
            {t("blocks.cta.text", [COMPANY.city, formatFcfa(50000)])}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary" size="lg">
            <Link to="/$locale/reservation" params={{ locale }}>
              {t("blocks.cta.reserve")}
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="technicalOutline"
            className="border-background/30 text-background hover:bg-background/10"
          >
            <Link to="/$locale/devis" params={{ locale }}>
              {t("blocks.cta.devis")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function TrustStats() {
  const { t } = useI18n();
  const stats = [
    { v: "5 000+", l: t("blocks.stats.repaired") },
    { v: "35 min", l: t("blocks.stats.delay") },
    { v: "200+", l: t("blocks.stats.parts") },
    { v: "4,8/5", l: t("blocks.stats.satisfaction") },
  ];
  return (
    <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.l} className="bg-card p-6">
          <div className="font-mono text-2xl font-medium md:text-3xl">{s.v}</div>
          <div className="at-eyebrow mt-2">{s.l}</div>
        </div>
      ))}
    </div>
  );
}
