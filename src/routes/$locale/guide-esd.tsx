import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/guide-esd")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/services");
    return {
      meta: [
        { title: "Guide de Sécurité Électrostatique (ESD) — Allô Techno Labs" },
        {
          name: "description",
          content: "Règles indispensables pour manipuler les cartes mères, processeurs et puces mémoire sans risque de décharge électrostatique.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: EsdSafetyGuidePage,
});

function EsdSafetyGuidePage() {
  const rules = [
    {
      title: "1. Le Danger Invisible des Décharges ESD",
      desc: "Le corps humain accumule jusqu'à 15 000 Volts d'électricité statique en marchant sur un tapis ou en frottant des vêtements synthétiques. Une simple décharge de 30 Volts suffit à détruire la couche d'oxyde d'un transistor MOSFET ou d'une barrette de RAM.",
    },
    {
      title: "2. Port du Bracelet Antistatique avec Résistance 1 MΩ",
      desc: "Toujours relier son poignet à la terre du bâtiment ou au châssis métallique de l'ordinateur. La résistance intégrée de 1 Mégohm protège le technicien en cas de contact avec le secteur.",
    },
    {
      title: "3. Tapis de Travail Conducteur Dissipatif",
      desc: "Toutes les cartes électroniques doivent être posées sur un tapis ESD dissipatif (résistance superficielle 10^6 à 10^9 Ohms/sq) et jamais sur une table en bois verni ou en plastique.",
    },
    {
      title: "4. Règle d'Or : Débrancher la Batterie en Premier",
      desc: "Avant toute manipulation d'un PC portable ou d'un MacBook, déconnectez impérativement la batterie interne pour annuler toutes les lignes d'alimentation permanentes (3.3V / 5V / 12V).",
    },
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* ─── Hero Header ─── */}
      <section className="border-b border-border py-12 bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="at-eyebrow text-primary font-bold">Laboratoire &amp; Bonnes Pratiques</span>
            <PageBreadcrumb items={[{ label: "Guide Sécurité ESD" }]} />
          </div>
          <h1 className="at-display text-3xl sm:text-5xl font-extrabold text-foreground">
            Guide de Sécurité Électrostatique (ESD)
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Découvrez comment notre atelier protège vos composants électroniques ultra-sensibles contre les micro-destructions invisibles causées par l'électricité statique.
          </p>
        </div>
      </section>

      {/* ─── Rules Grid ─── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule, idx) => (
            <div key={idx} className="border border-border bg-card p-5 rounded-2xl space-y-2.5 shadow-xs">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                Norme IEC 61340-5-1
              </span>
              <h3 className="font-bold text-sm text-foreground">{rule.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>

        {/* ─── Comparison Do / Don't ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-emerald-600/30 bg-emerald-600/5 p-5 rounded-2xl space-y-3">
            <span className="font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="size-4" /> Gestes Professionnels Homologués :
            </span>
            <ul className="space-y-2 text-foreground">
              <li>✓ Toucher une surface métallique mise à la terre avant de saisir une carte.</li>
              <li>✓ Transporter les composants dans des sachets antistatiques métallisés blindés.</li>
              <li>✓ Utiliser des tournevis avec manche dissipateur ESD certifié.</li>
            </ul>
          </div>

          <div className="border border-destructive/30 bg-destructive/5 p-5 rounded-2xl space-y-3">
            <span className="font-bold text-destructive uppercase tracking-wide flex items-center gap-1.5 text-xs">
              <XCircle className="size-4" /> Erreurs Fréquentes à Proscrire :
            </span>
            <ul className="space-y-2 text-foreground">
              <li>✕ Porter des pulls en laine ou vêtements synthétiques en ouvrant un ordinateur.</li>
              <li>✕ Poser une carte mère nue sur du papier journal ou une nappe en plastique.</li>
              <li>✕ Passer un pinceau ordinaire non-antistatique sur un processeur ouvert.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
