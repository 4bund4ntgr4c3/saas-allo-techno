/**
 * Point d'entrée des fonctions et types B2B.
 * 
 * Les implémentations ont été modularisées dans `src/lib/org/` :
 * - `org-client.ts` : Client Supabase contextuel et helpers d'authentification B2B.
 * - `org-core.functions.ts` : Organisations, membres et gestion des rôles B2B.
 * - `org-equipment.functions.ts` : Parc matériel, QR codes et garanties.
 * - `org-sites.functions.ts` : Sites, agences et départements.
 * - `org-tickets.functions.ts` : Tickets SAV, interventions et pièces jointes.
 * - `org-billing-maintenance.functions.ts` : Facturation B2B et plannings de maintenance préventive.
 */

export * from "./org";
