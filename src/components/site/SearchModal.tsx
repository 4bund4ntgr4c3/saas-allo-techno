import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  HelpCircle,
  Newspaper,
  Package,
  Smartphone,
  Store,
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
};

const PAGES: Omit<Item, "icon">[] = [
  {
    id: "page-reservation",
    label: "Réserver un créneau",
    hint: "Prise de rendez-vous atelier",
    keywords: "reserver rendez-vous booking rdv slot creneau",
    target: { to: "/reservation" },
  },
  {
    id: "page-reparations",
    label: "Réparations",
    hint: "Diagnostic en ligne",
    keywords: "diagnostic reparer panne atelier",
    target: { to: "/reparations" },
  },
  {
    id: "page-catalogue",
    label: "Catalogue des appareils",
    hint: "Tous les modèles, recherche et filtres",
    keywords: "tous les appareils modeles liste",
    target: { to: "/catalogue" },
  },
  {
    id: "page-suivi",
    label: "Suivi de réparation",
    hint: "État de votre dossier",
    keywords: "suivre commande statut dossier ticket",
    target: { to: "/suivi" },
  },
  {
    id: "page-tarifs",
    label: "Tarifs",
    hint: "Prix des réparations",
    keywords: "prix cout combien",
    target: { to: "/tarifs" },
  },
  {
    id: "page-devis",
    label: "Devis instantané",
    hint: "Estimation sans engagement",
    keywords: "estimation devis prix",
    target: { to: "/devis" },
  },
  {
    id: "page-reprise",
    label: "Reprise",
    hint: "Nous rachetons votre appareil",
    keywords: "revente vendre acheter occasion",
    target: { to: "/reprise" },
  },
  {
    id: "page-garantie",
    label: "Garantie",
    hint: "Nos garanties atelier",
    keywords: "garantie sav",
    target: { to: "/garantie" },
  },
  {
    id: "page-boutique",
    label: "Boutique",
    hint: "Accessoires et pièces détachées",
    keywords: "acheter accessoire coque chargeur",
    target: { to: "/boutique" },
  },
  {
    id: "page-blog",
    label: "Blog",
    hint: "Guides et astuces",
    keywords: "articles guides conseils",
    target: { to: "/blog" },
  },
  {
    id: "page-faq",
    label: "FAQ",
    hint: "Questions fréquentes",
    keywords: "questions reponses aide",
    target: { to: "/faq" },
  },
  {
    id: "page-avis",
    label: "Avis clients",
    hint: "Témoignages de nos clients",
    keywords: "avis temoignages notes",
    target: { to: "/avis" },
  },
  {
    id: "page-entreprises",
    label: "Entreprises",
    hint: "Prestations professionnelles",
    keywords: "pro entreprise bureau partenariat",
    target: { to: "/entreprises" },
  },
  {
    id: "page-contact",
    label: "Contact",
    hint: "Atelier Abomey-Calavi",
    keywords: "adresse telephone whatsapp contact",
    target: { to: "/contact" },
  },
  {
    id: "page-panier",
    label: "Mon panier",
    hint: "Votre commande boutique",
    keywords: "commande panier checkout",
    target: { to: "/panier" },
  },
];

const PAGE_ICON: LucideIcon = ArrowRight;

const GROUP_CLASS =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em]";

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useI18n();

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
    const match = (s: string) => !q || s.toLowerCase().includes(q);
    const cap = 20;

    const pages: Item[] = PAGES.filter((p) => match(`${p.label} ${p.keywords}`)).map((p) => ({
      ...p,
      icon: PAGE_ICON,
    }));

    const categories: Item[] = q
      ? CATEGORIES.filter(match).map((c) => ({
          id: `cat-${c}`,
          label: `Réparer un ${c.toLowerCase()}`,
          hint: "Commencer un diagnostic",
          keywords: c,
          icon: HelpCircle,
          target: { to: "/reparations", search: { categorie: c } },
        }))
      : [];

    const brands: Item[] = BRANDS.filter((b) => match(b.name))
      .slice(0, q ? 8 : 19)
      .map((b) => ({
        id: `brand-${b.slug}`,
        label: b.name,
        hint: b.tag,
        keywords: `${b.name} ${b.tag}`,
        icon: Store,
        target: { to: `/reparations/${b.slug}` },
      }));

    const devices: Item[] = q
      ? DEVICES.map((d) => {
          const b = brandName(d.brand);
          let rank = 3;
          const n = d.name.toLowerCase();
          const ql = q;
          if (n.startsWith(ql)) rank = 0;
          else if (n.includes(ql)) rank = 1;
          else if (b.toLowerCase().startsWith(ql)) rank = 2;
          return { d, b, rank };
        })
          .filter(({ d, b }) => match(`${d.name} ${b} ${d.series} ${d.category}`))
          .sort((a, z) => a.rank - z.rank || a.d.name.localeCompare(z.d.name))
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
      ? ACCESSORIES.filter((a) => match(`${a.name} ${a.category}`))
          .slice(0, cap)
          .map((a) => ({
            id: `acc-${a.slug}`,
            label: a.name,
            hint: `Boutique · ${a.category}`,
            keywords: `${a.name} ${a.category}`,
            icon: Package,
            target: { to: `/boutique/${a.slug}` },
          }))
      : [];

    const posts: Item[] = q
      ? POSTS.filter((p) => match(`${p.title} ${p.excerpt} ${p.category}`))
          .slice(0, cap)
          .map((p) => ({
            id: `post-${p.slug}`,
            label: p.title,
            hint: `Blog · ${p.category} · ${p.date}`,
            keywords: `${p.title} ${p.excerpt} ${p.category}`,
            icon: Newspaper,
            target: { to: `/blog/${p.slug}` },
          }))
      : [];

    const faq: Item[] = q
      ? FAQ.filter((f) => match(`${f.q} ${f.a} ${f.cat}`))
          .slice(0, cap)
          .map((f, i) => ({
            id: `faq-${i}`,
            label: f.q,
            hint: `FAQ · ${f.cat}`,
            keywords: `${f.q} ${f.a} ${f.cat}`,
            icon: HelpCircle,
            target: { to: "/faq" },
          }))
      : [];

    return { pages, categories, brands, devices, accessories, posts, faq };
  }, [query]);

  const total = useMemo(() => Object.values(groups).reduce((n, g) => n + g.length, 0), [groups]);

  const go = (item: Item) => {
    setOpen(false);
    setQuery("");
    navigate({
      to: item.target.to as never,
      search: (item.target.search ?? {}) as never,
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Recherche sur le site</DialogTitle>
      <Command shouldFilter={false}>
        <div className="flex items-center justify-between border-b py-3 pl-4 pr-12">
          <span className="at-eyebrow">Recherche Allô Techno</span>
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
          placeholder="Rechercher un appareil, une marque, un article…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {total === 0 && (
            <div className="flex flex-col items-center gap-1 py-10 text-center">
              <span className="at-eyebrow">Aucun résultat</span>
              <span className="text-sm text-muted-foreground">
                Rien trouvé pour « {query} » — essayez « iPhone », « écran », « batterie »…
              </span>
            </div>
          )}
          {groups.pages.length > 0 && (
            <CommandGroup heading="Pages" className={GROUP_CLASS}>
              {groups.pages.map((p) => (
                <CommandItem key={p.id} value={p.id} onSelect={() => go(p)}>
                  <p.icon />
                  <span>{p.label}</span>
                  <span className="ml-auto truncate pl-4 text-xs text-muted-foreground">
                    {p.hint}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.categories.length > 0 && (
            <CommandGroup heading="Diagnostic" className={GROUP_CLASS}>
              {groups.categories.map((c) => (
                <CommandItem key={c.id} value={c.id} onSelect={() => go(c)}>
                  <c.icon />
                  <span>{t(c.label)}</span>
                  <span className="ml-auto truncate pl-4 text-xs text-muted-foreground">
                    {c.hint}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.brands.length > 0 && (
            <CommandGroup heading="Marques" className={GROUP_CLASS}>
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
            <CommandGroup heading="Appareils" className={GROUP_CLASS}>
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
            <CommandGroup heading="Boutique" className={GROUP_CLASS}>
              {groups.accessories.map((a) => (
                <CommandItem key={a.id} value={a.id} onSelect={() => go(a)}>
                  <a.icon />
                  <span>{a.label}</span>
                  <span className="ml-auto truncate pl-4 text-xs text-muted-foreground">
                    {a.hint}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.posts.length > 0 && (
            <CommandGroup heading="Blog" className={GROUP_CLASS}>
              {groups.posts.map((p) => (
                <CommandItem key={p.id} value={p.id} onSelect={() => go(p)}>
                  <p.icon />
                  <span className="truncate">{p.label}</span>
                  <span className="ml-auto shrink-0 pl-4 text-xs text-muted-foreground">
                    {p.hint}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.faq.length > 0 && (
            <CommandGroup heading="FAQ" className={GROUP_CLASS}>
              {groups.faq.map((f) => (
                <CommandItem key={f.id} value={f.id} onSelect={() => go(f)}>
                  <f.icon />
                  <span className="truncate">{t(f.label)}</span>
                  <span className="ml-auto shrink-0 pl-4 text-xs text-muted-foreground">
                    {f.hint}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="flex items-center justify-between gap-4 border-t bg-muted/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>
            {total} résultat{total > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-sm border border-border px-1.5 py-0.5">↑↓</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-sm border border-border px-1.5 py-0.5">⏎</kbd>
              ouvrir
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-sm border border-border px-1.5 py-0.5">esc</kbd>
              fermer
            </span>
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
