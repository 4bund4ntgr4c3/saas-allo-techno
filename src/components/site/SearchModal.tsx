import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  HelpCircle,
  Newspaper,
  Package,
  Smartphone,
  Store,
  Clock,
  type LucideIcon,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { ACCESSORIES, BRANDS, CATEGORIES, DEVICES, FAQ, POSTS, brandName } from "@/data/catalog";
import { SEARCH_OPEN_EVENT } from "@/lib/search-events";
import { useI18n } from "@/lib/i18n/context";

type Target = { to: string; search?: { categorie: string } };

type Item = {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  icon: LucideIcon;
  target: Target;
  score?: number;
  labelKey?: string;
  labelArgs?: (string | number)[];
  hintKey?: string;
  badgeKey?: string;
};

const PAGES: Omit<Item, "icon">[] = [
  {
    id: "page-reservation",
    label: "Réserver un créneau",
    hint: "Prise de rendez-vous atelier",
    keywords: "reserver rendez-vous booking rdv slot creneau",
    target: { to: "/reservation" },
    labelKey: "search.page.reservation",
    hintKey: "search.page.reservation.hint",
  },
  {
    id: "page-reparations",
    label: "Réparations",
    hint: "Diagnostic en ligne",
    keywords: "diagnostic reparer panne atelier",
    target: { to: "/reparations" },
    labelKey: "nav.reparations",
    hintKey: "search.page.reparations.hint",
  },
  {
    id: "page-catalogue",
    label: "Catalogue des appareils",
    hint: "Tous les modèles, recherche et filtres",
    keywords: "tous les appareils modeles liste",
    target: { to: "/catalogue" },
    labelKey: "search.page.catalogue",
    hintKey: "search.page.catalogue.hint",
  },
  {
    id: "page-suivi",
    label: "Suivi de réparation",
    hint: "État de votre dossier",
    keywords: "suivre commande statut dossier ticket",
    target: { to: "/suivi" },
    labelKey: "search.page.suivi",
    hintKey: "search.page.suivi.hint",
  },
  {
    id: "page-tarifs",
    label: "Tarifs",
    hint: "Prix des réparations",
    keywords: "prix cout combien",
    target: { to: "/tarifs" },
    labelKey: "nav.tarifs",
    hintKey: "search.page.tarifs.hint",
  },
  {
    id: "page-devis",
    label: "Devis instantané",
    hint: "Estimation sans engagement",
    keywords: "estimation devis prix",
    target: { to: "/devis" },
    labelKey: "nav.devis",
    hintKey: "search.page.devis.hint",
  },
  {
    id: "page-reprise",
    label: "Reprise",
    hint: "Nous rachètons votre appareil",
    keywords: "revente vendre acheter occasion",
    target: { to: "/reprise" },
    labelKey: "nav.reprise",
    hintKey: "search.page.reprise.hint",
  },
  {
    id: "page-garantie",
    label: "Garantie",
    hint: "Nos garanties atelier",
    keywords: "garantie sav",
    target: { to: "/garantie" },
    labelKey: "nav.garantie",
    hintKey: "search.page.garantie.hint",
  },
  {
    id: "page-boutique",
    label: "Boutique",
    hint: "Accessoires et pièces détachées",
    keywords: "acheter accessoire coque chargeur",
    target: { to: "/boutique" },
    labelKey: "nav.boutique",
    hintKey: "search.page.boutique.hint",
  },
  {
    id: "page-blog",
    label: "Blog",
    hint: "Guides et astuces",
    keywords: "articles guides conseils",
    target: { to: "/blog" },
    labelKey: "nav.blog",
    hintKey: "search.page.blog.hint",
  },
  {
    id: "page-faq",
    label: "FAQ",
    hint: "Questions fréquentes",
    keywords: "questions reponses aide",
    target: { to: "/faq" },
    labelKey: "nav.faq",
    hintKey: "search.page.faq.hint",
  },
  {
    id: "page-avis",
    label: "Avis clients",
    hint: "Témoignages de nos clients",
    keywords: "avis temoignages notes",
    target: { to: "/avis" },
    labelKey: "nav.avis",
    hintKey: "search.page.avis.hint",
  },
  {
    id: "page-entreprises",
    label: "Entreprises",
    hint: "Prestations professionnelles",
    keywords: "pro entreprise bureau partenariat",
    target: { to: "/entreprises" },
    labelKey: "nav.entreprises",
    hintKey: "search.page.entreprises.hint",
  },
  {
    id: "page-contact",
    label: "Contact",
    hint: "Atelier Abomey-Calavi",
    keywords: "adresse telephone whatsapp contact",
    target: { to: "/contact" },
    labelKey: "nav.contact",
    hintKey: "search.page.contact.hint",
  },
  {
    id: "page-panier",
    label: "Mon panier",
    hint: "Votre commande boutique",
    keywords: "commande panier checkout",
    target: { to: "/panier" },
    labelKey: "nav.panier",
    hintKey: "search.page.panier.hint",
  },
];

const PAGE_ICON: LucideIcon = ArrowRight;

const GROUP_CLASS =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em]";

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const { locale, t } = useI18n();

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("at-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // malformed data or localStorage unavailable
    }
  }, []);

  const labelOf = (item: Item) => (item.labelKey ? t(item.labelKey, item.labelArgs) : item.label);
  const hintOf = (item: Item) =>
    item.badgeKey
      ? `${t(item.badgeKey)} · ${item.hint}`
      : item.hintKey
        ? t(item.hintKey)
        : item.hint;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(SEARCH_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SEARCH_OPEN_EVENT, onOpen);
    };
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cap = 20;

    // Enhanced matching with scoring
    const scoreMatch = (text: string): number => {
      if (!q) return 1;
      const lower = text.toLowerCase();
      if (lower === q) return 100;
      if (lower.startsWith(q)) return 50;
      if (lower.includes(q)) return 30;
      const words = q.split(/\s+/);
      let score = 0;
      for (const w of words) {
        if (w.length < 2) continue;
        if (lower.includes(w)) score += 10;
        else {
          // Fuzzy: prefix match
          const textWords = lower.split(/\s+/);
          for (const tw of textWords) {
            if (tw.startsWith(w) || w.startsWith(tw)) {
              score += 5;
              break;
            }
          }
        }
      }
      return score;
    };

    const pages: Item[] = PAGES.map((p) => ({
      ...p,
      icon: PAGE_ICON,
      score: scoreMatch(`${p.label} ${p.keywords}`),
    }))
      .filter((p) => p.score > 0)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, q ? cap : 15);

    const categories: Item[] = q
      ? CATEGORIES.map((c) => ({ c, score: scoreMatch(c) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map(({ c, score }) => ({
            id: `cat-${c}`,
            label: c,
            hint: c,
            keywords: c,
            icon: HelpCircle,
            target: { to: "/reparations", search: { categorie: c } },
            labelKey: "search.category.repair",
            labelArgs: [c.toLowerCase()],
            hintKey: "search.category.hint",
            score,
          }))
      : [];

    const brands: Item[] = BRANDS.map((b) => ({ b, score: scoreMatch(`${b.name} ${b.tag}`) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, q ? 8 : 19)
      .map(({ b, score }) => ({
        id: `brand-${b.slug}`,
        label: b.name,
        hint: b.tag,
        keywords: `${b.name} ${b.tag}`,
        icon: Store,
        target: { to: `/reparations/${b.slug}` },
        score,
      }));

    const devices: Item[] = q
      ? DEVICES.map((d) => {
          const b = brandName(d.brand);
          const searchText = `${d.name} ${b} ${d.series} ${d.category}`.toLowerCase();
          let rank = 3;
          const n = d.name.toLowerCase();
          if (n.startsWith(q)) rank = 0;
          else if (n.includes(q)) rank = 1;
          else if (b.toLowerCase().startsWith(q)) rank = 2;
          // Fuzzy: check each query word
          const words = q.split(/\s+/);
          for (const w of words) {
            if (w.length < 2) continue;
            if (searchText.includes(w)) {
              rank = Math.min(rank, 2);
              break;
            }
          }
          return { d, b, rank, score: scoreMatch(searchText) };
        })
          .filter(({ score }) => score > 0)
          .sort(
            (a, z) =>
              (z.score ?? 0) - (a.score ?? 0) ||
              a.rank - z.rank ||
              a.d.name.localeCompare(z.d.name),
          )
          .slice(0, cap)
          .map(({ d, b }) => ({
            id: `device-${d.slug}`,
            label: d.name,
            hint: `${b} · ${d.series} · ${d.category}`,
            keywords: `${d.name} ${b} ${d.series} ${d.category}`,
            icon: Smartphone,
            target: { to: `/appareil/${d.slug}` },
          }))
      : [];

    const accessories: Item[] = q
      ? ACCESSORIES.map((a) => ({ a, score: scoreMatch(`${a.name} ${a.category}`) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, cap)
          .map(({ a }) => ({
            id: `acc-${a.slug}`,
            label: a.name,
            hint: a.category,
            badgeKey: "search.badge.shop",
            keywords: `${a.name} ${a.category}`,
            icon: Package,
            target: { to: `/boutique/${a.slug}` },
          }))
      : [];

    const posts: Item[] = q
      ? POSTS.map((p) => ({ p, score: scoreMatch(`${p.title} ${p.excerpt} ${p.category}`) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, cap)
          .map(({ p }) => ({
            id: `post-${p.slug}`,
            label: p.title,
            hint: `${p.category} · ${p.date}`,
            badgeKey: "search.badge.blog",
            keywords: `${p.title} ${p.excerpt} ${p.category}`,
            icon: Newspaper,
            target: { to: `/blog/${p.slug}` },
          }))
      : [];

    const faq: Item[] = q
      ? FAQ.map((f, i) => ({ f, i, score: scoreMatch(`${f.q} ${f.a} ${f.cat}`) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, cap)
          .map(({ f, i }) => ({
            id: `faq-${i}`,
            label: f.q,
            hint: f.cat,
            badgeKey: "search.badge.faq",
            keywords: `${f.q} ${f.a} ${f.cat}`,
            icon: HelpCircle,
            target: { to: "/faq" },
          }))
      : [];

    return { pages, categories, brands, devices, accessories, posts, faq };
  }, [query]);

  const total = useMemo(() => Object.values(groups).reduce((n, g) => n + g.length, 0), [groups]);

  const go = useCallback(
    (item: Item) => {
      // Save to recent searches
      if (query.trim()) {
        setRecentSearches((prev) => {
          const updated = [query.trim(), ...prev.filter((s) => s !== query.trim())].slice(0, 5);
          localStorage.setItem("at-recent-searches", JSON.stringify(updated));
          return updated;
        });
      }
      setOpen(false);
      setQuery("");
      navigate({
        to: `/${locale}${item.target.to}` as never,
        search: (item.target.search ?? {}) as never,
      });
    },
    [query, locale, navigate],
  );

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("at-recent-searches");
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">{t("search.dialog.title")}</DialogTitle>
      <Command shouldFilter={false}>
        <div className="flex items-center justify-between border-b py-3 pl-4 pr-12">
          <span className="at-eyebrow">{t("search.title")}</span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Ctrl
            </kbd>
            <kbd className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              K
            </kbd>
          </span>
        </div>
        <CommandInput
          aria-label={t("search.aria.label")}
          placeholder={t("search.placeholder")}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!query.trim() && recentSearches.length > 0 && (
            <CommandGroup
              heading={t("search.group.recent") ?? "Recherches récentes"}
              className={GROUP_CLASS}
            >
              {recentSearches.map((s, i) => (
                <CommandItem key={`recent-${i}`} value={`recent-${s}`} onSelect={() => setQuery(s)}>
                  <Clock className="size-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{s}</span>
                </CommandItem>
              ))}
              <CommandItem value="clear-recent" onSelect={clearRecent}>
                <span className="text-xs text-destructive">{t("search.clearHistory")}</span>
              </CommandItem>
            </CommandGroup>
          )}
          {total === 0 && (
            <div className="flex flex-col items-center gap-1 py-10 text-center">
              <span className="at-eyebrow">{t("search.empty.title")}</span>
              <span className="text-sm text-muted-foreground">
                {t("search.empty.text", [query])}
              </span>
            </div>
          )}
          {groups.pages.length > 0 && (
            <CommandGroup heading={t("search.group.pages")} className={GROUP_CLASS}>
              {groups.pages.map((p) => (
                <CommandItem key={p.id} value={p.id} onSelect={() => go(p)}>
                  <p.icon />
                  <span>{labelOf(p)}</span>
                  <span className="ml-auto truncate pl-4 text-xs text-muted-foreground">
                    {hintOf(p)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.categories.length > 0 && (
            <CommandGroup heading={t("search.group.diagnostic")} className={GROUP_CLASS}>
              {groups.categories.map((c) => (
                <CommandItem key={c.id} value={c.id} onSelect={() => go(c)}>
                  <c.icon />
                  <span>{labelOf(c)}</span>
                  <span className="ml-auto truncate pl-4 text-xs text-muted-foreground">
                    {hintOf(c)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.brands.length > 0 && (
            <CommandGroup heading={t("search.group.brands")} className={GROUP_CLASS}>
              {groups.brands.map((b) => (
                <CommandItem key={b.id} value={b.id} onSelect={() => go(b)}>
                  <b.icon />
                  <span>{b.label}</span>
                  <span className="ml-auto truncate pl-4 text-xs text-muted-foreground">
                    {t(b.hint)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.devices.length > 0 && (
            <CommandGroup heading={t("search.group.devices")} className={GROUP_CLASS}>
              {groups.devices.map((d) => (
                <CommandItem key={d.id} value={d.id} onSelect={() => go(d)}>
                  <d.icon />
                  <span>{d.label}</span>
                  <span className="ml-auto truncate pl-4 text-xs text-muted-foreground">
                    {d.hint}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.accessories.length > 0 && (
            <CommandGroup heading={t("search.group.shop")} className={GROUP_CLASS}>
              {groups.accessories.map((a) => (
                <CommandItem key={a.id} value={a.id} onSelect={() => go(a)}>
                  <a.icon />
                  <span>{a.label}</span>
                  <span className="ml-auto truncate pl-4 text-xs text-muted-foreground">
                    {hintOf(a)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.posts.length > 0 && (
            <CommandGroup heading={t("search.group.blog")} className={GROUP_CLASS}>
              {groups.posts.map((p) => (
                <CommandItem key={p.id} value={p.id} onSelect={() => go(p)}>
                  <p.icon />
                  <span className="truncate">{p.label}</span>
                  <span className="ml-auto shrink-0 pl-4 text-xs text-muted-foreground">
                    {hintOf(p)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.faq.length > 0 && (
            <CommandGroup heading={t("search.group.faq")} className={GROUP_CLASS}>
              {groups.faq.map((f) => (
                <CommandItem key={f.id} value={f.id} onSelect={() => go(f)}>
                  <f.icon />
                  <span className="truncate">{labelOf(f)}</span>
                  <span className="ml-auto shrink-0 pl-4 text-xs text-muted-foreground">
                    {hintOf(f)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="flex items-center justify-between gap-4 border-t bg-muted/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span role="status">
            {t(total > 1 ? "search.count.plural" : "search.count.single", [total])}
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-sm border border-border px-1.5 py-0.5">↑↓</kbd>
              {t("search.kbd.navigate")}
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-sm border border-border px-1.5 py-0.5">⏎</kbd>
              {t("search.kbd.open")}
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-sm border border-border px-1.5 py-0.5">esc</kbd>
              {t("search.kbd.close")}
            </span>
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
