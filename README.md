# Allô Techno

Site web d'Allô Techno, entreprise spécialisée dans la réparation de smartphones, tablettes, ordinateurs, MacBook, iMac, consoles de jeux, montres connectées et autres appareils électroniques, située à Abomey-Calavi (Bénin).

## Fonctionnalités

- Page d'accueil immersive avec recherche intelligente d'appareils (assistant de diagnostic en 5 étapes).
- Pages de réparation par marque et fiches détaillées par appareil (pannes, tarifs, délais, garanties, pièces utilisées, FAQ).
- Réservation en ligne avec disponibilités en temps réel (créneaux par demi-journée et par heure), dépôt en boutique ou enlèvement à domicile.
- Suivi de réparation par numéro de dossier, avec historique des changements de statut.
- Espace client (profil, réservations, annulation) et espace administrateur / technicien (gestion des statuts des dossiers).
- Demande de devis, FAQ, blog, avis clients, garantie, offres entreprises (B2B), reprise d'appareils, boutique d'accessoires.
- SEO par page (meta, Open Graph, sitemap).

## Stack technique

- [TanStack Start](https://tanstack.com/start) (React 19, SSR) avec TanStack Router et TanStack Query
- [Vite](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com) v4 + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) : base PostgreSQL, authentification, Realtime (disponibilités des créneaux), RLS et fonctions SQL
- [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev)
- [Motion](https://motion.dev) et [Recharts](https://recharts.org)

## Structure du projet

```
src/
  routes/                # Pages de l'application (TanStack Router)
  components/site/       # Composants propres au site
  components/ui/         # Composants shadcn/ui
  data/                  # Catalogue statique (marques, appareils, tarifs, accessoires, blog, FAQ, avis)
  hooks/                 # Hooks (session, disponibilité des créneaux)
  integrations/supabase/ # Clients Supabase (navigateur, serveur, auth)
  lib/                   # Logique métier (schémas, devis, fonctions serveur)
supabase/
  migrations/            # Schéma SQL, RLS, fonctions et triggers
```

## Développement

Prérequis : Node.js 20+ et npm (ou [bun](https://bun.sh)).

```sh
npm install
npm run dev
```

Scripts disponibles :

```sh
npm run build          # build de production
npm run preview        # prévisualisation du build
npm run lint           # eslint
npm run format         # prettier
```

## Configuration

Le projet s'appuie sur Supabase. Les variables d'environnement suivantes sont attendues (fichier `.env`) :

- `VITE_SUPABASE_URL` / `SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (côté serveur uniquement)
