import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { COMPANY, REVIEWS, STEPS, formatFcfa } from "@/data/catalog";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="grid gap-px border border-border bg-border md:grid-cols-3">
      {STEPS.map((s) => (
        <div key={s.n} className="bg-card p-8">
          <span className="font-mono text-4xl font-medium text-primary">{s.n}</span>
          <h3 className="mt-6 text-lg font-bold tracking-tight">{s.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} étoiles sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < n ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

export function ReviewsGrid({ limit = 6 }: { limit?: number }) {
  return (
    <div className="grid gap-px border border-border bg-border md:grid-cols-3">
      {REVIEWS.slice(0, limit).map((r) => (
        <figure key={r.name} className="bg-card p-8">
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
  return (
    <div className="flex flex-wrap items-center gap-4 border border-border bg-surface p-4">
      <span className="at-eyebrow">Paiements acceptés</span>
      <span className="border border-border px-3 py-1 font-mono text-[10px] font-bold uppercase">MTN MoMo</span>
      <span className="border border-border px-3 py-1 font-mono text-[10px] font-bold uppercase">Moov Money</span>
      <span className="border border-border px-3 py-1 font-mono text-[10px] font-bold uppercase">Espèces</span>
      <span className="border border-border px-3 py-1 font-mono text-[10px] font-bold uppercase">Virement B2B</span>
    </div>
  );
}

export function CtaBand() {
  return (
    <section className="border-y border-border bg-foreground py-16 text-background">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center">
        <div>
          <h2 className="at-display text-3xl">Un appareil en panne aujourd'hui ?</h2>
          <p className="mt-3 max-w-lg text-sm text-background/70">
            Diagnostic gratuit, devis en 15 minutes, réparation express à {COMPANY.city}. Enlèvement
            gratuit dès {formatFcfa(50000)} de réparation.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="primaryBlock" size="lg">
            <Link to="/reservation">Réserver une réparation</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="technicalOutline"
            className="border-background/30 text-background hover:bg-background/10"
          >
            <Link to="/devis">Devis instantané</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function TrustStats() {
  const stats = [
    { v: "12 400+", l: "Appareils réparés" },
    { v: "35 min", l: "Délai moyen smartphone" },
    { v: "180+", l: "Pièces en stock" },
    { v: "4,9/5", l: "Satisfaction client" },
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
