-- Multilingue : ajout d'un champ langue sur les articles de blog.
-- La clé unique passe de (slug) à (slug, locale) pour autoriser une version
-- par langue. On conserve un repli : si aucun article n'existe pour la langue
-- demandée, la lecture retombe sur les données statiques françaises.

alter table public.blog_posts
  add column if not exists locale text not null default 'fr';

-- Remplacer la contrainte unique sur slug (générée par default) par (slug, locale).
alter table public.blog_posts drop constraint if exists blog_posts_slug_key;
alter table public.blog_posts drop constraint if exists blog_posts_slug_locale_key;
alter table public.blog_posts
  add constraint blog_posts_slug_locale_key unique (slug, locale);

comment on column public.blog_posts.locale is 'Langue du contenu : fr (défaut) ou en.';

-- ===========================================================================
-- Versions anglaises des articles déjà seedés en français (la langue du visiteur).
-- ===========================================================================

insert into public.blog_posts (slug, locale, title, excerpt, date, category, reading_time, body)
values
  (
    'reparation-telephone-abomey-calavi-guide',
    'en',
    'Getting your phone repaired in Abomey-Calavi: the complete 2026 guide',
    'Average prices, turnaround times, served areas and the right questions to ask before trusting a repair shop.',
    '2026-07-28',
    'Local',
    '7 min',
    '["Abomey-Calavi now handles a large share of the Cotonou area smartphone repairs. Between Zogbadjè, Tankpè, Akassato and Godomey the offer is wide but uneven: some shops fit untested parts and give no receipt.","First move: ask for a free written diagnostic. A serious shop tells you the actual fault, the part used and the warranty term before disassembling anything.","Second move: traceability. A case reference lets you follow the repair progress.","Third move: deadlines. A screen or battery takes under an hour; oxidation cleaning or board micro-soldering takes 24 to 72 hours.","Finally, back up your data before dropping off your device."]'
  ),
  (
    'payer-reparation-mobile-money-benin',
    'en',
    'Paying your repair with Mobile Money in Benin: what to know',
    'MoMo, Celtiis Cash, cash or transfer: secure your repair payment and get a real invoice.',
    '2026-06-05',
    'Local',
    '4 min',
    '["In Abomey-Calavi most repairs are now settled with Mobile Money. Convenient, but a few precautions avoid unpleasant surprises.","Never pay the full amount before the diagnostic. A deposit on an ordered part is normal; full prepayment is not.","Check that the Mobile Money number matches the shop business name.","Ask for an invoice stating the model, fault, part installed and warranty.","Keep the transaction confirmation SMS. "]'
  ),
  (
    'prolonger-batterie-smartphone-benin',
    'en',
    'Extending your smartphone battery in Benin: 5 simple habits',
    'Heat, power cuts, low-quality chargers: how to protect your battery health.',
    '2026-06-18',
    'Guides',
    '6 min',
    '["Heat is the number one enemy of a lithium-ion battery. Leaving your phone in the sun or in a closed car accelerates cell aging.","Avoid constant 100% charges: the ideal range is between 20% and 80%.","Use a certified charger matched to your device output. Cheap chargers deliver unstable voltage.","After a power cut, wait for the grid to stabilise before plugging back in.","If battery life drops suddenly, get a free battery health check at Allô Techno."]'
  ),
  (
    'harmattan-poussiere-smartphone-calavi',
    'en',
    'Harmattan dust: protecting your phone in Calavi',
    'Blocked charging port, muffled microphone, overheating console: dry-season damage and how to avoid it.',
    '2026-06-30',
    'Local',
    '5 min',
    '["During the harmattan, fine dust gets everywhere: charging ports, microphone grilles, console and laptop fans.","A blocked charging port and intermittent charging are often just compacted dust in the connector: a cleaning fixes it.","Mic grilles clog, muffling your voice on calls.","Consoles and PCs get louder and shut down as the heatsink saturates; an annual clean with fresh thermal paste prevents the failure.","A preventive workshop clean takes under 30 minutes."]'
  )
on conflict (slug, locale) do nothing;