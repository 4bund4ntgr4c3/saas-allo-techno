import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import {
  Download,
  ExternalLink,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { USEFUL_TOOLS, type ToolItem } from "@/data/catalog/driver-tools";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/outils")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/services");
    return {
      meta: [
        { title: "Boîte à Outils & Pilotes Utilitaires — Allô Techno Toolbox" },
        {
          name: "description",
          content: "Téléchargez gratuitement nos outils officiels et certifiés pour tester la santé de vos disques, batteries et assainir votre PC/Mac.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: ToolsPage,
});

function ToolsPage() {
  const [selectedCat, setSelectedCat] = React.useState<string>("Tous");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const categories = [
    { id: "Tous", label: "Tous les outils" },
    { id: "diagnostic", label: "Diagnostic Santé & Disque" },
    { id: "securite", label: "Nettoyage & Sécurité" },
    { id: "clonage_ssd", label: "Clonage & Migration SSD" },
  ];

  const filteredTools = React.useMemo(() => {
    return USEFUL_TOOLS.filter((t) => {
      const matchCat = selectedCat === "Tous" || t.category === selectedCat;
      const matchQuery =
        !searchQuery.trim() ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCat, searchQuery]);

  return (
    <div className="min-h-screen pb-16">
      {/* ─── Hero Header ─── */}
      <section className="border-b border-border py-12 bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="at-eyebrow text-primary font-bold">Ressources &amp; Utilitaires</span>
            <PageBreadcrumb items={[{ label: "Boîte à Outils" }]} />
          </div>
          <h1 className="at-display text-3xl sm:text-5xl font-extrabold text-foreground">
            Boîte à Outils &amp; Pilotes Utilitaires
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Retrouvez les logiciels de diagnostic et pilotes indispensables recommandés par nos techniciens atelier. Liens vérifiés, sécurisés et sans publicités indésirables.
          </p>
        </div>
      </section>

      {/* ─── Search & Filters Bar ─── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCat(c.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCat === c.id
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Rechercher un logiciel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* ─── Tools Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTools.map((tool: ToolItem) => (
            <div
              key={tool.id}
              className="border border-border bg-card p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs hover:border-border/80 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{tool.name}</h3>
                    <span className="text-[10px] font-mono text-primary font-semibold">
                      {tool.os} · {tool.version} ({tool.fileSize})
                    </span>
                  </div>
                  {tool.isOfficial && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-600/40 bg-emerald-600/10 text-[10px]">
                      <ShieldCheck className="size-3 mr-1" /> Certifié Propre
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Téléchargement direct éditeur</span>
                <Button asChild variant="technical" size="sm" className="text-xs font-bold h-8">
                  <a href={tool.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="size-3.5 mr-1" /> Télécharger <ExternalLink className="size-3 ml-1 opacity-70" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
