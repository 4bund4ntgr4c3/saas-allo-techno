import { getRequestUrl } from "@tanstack/react-start/server";
import { DEFAULT_ORIGIN, safeOriginFromHostname } from "./origin";

/**
 * Origine sûre côté serveur : le host de la requête s'il est dans l'allowlist
 * (domaines du site / previews workers), sinon l'origine fonctionnelle par
 * défaut. Jamais d'hôte arbitraire. Ce module est serveur-only (importe
 * @tanstack/react-start/server) : ne pas l'importer depuis un fichier client.
 */
export function getSafeServerOrigin(): string {
  try {
    return safeOriginFromHostname(getRequestUrl().origin);
  } catch {
    return DEFAULT_ORIGIN;
  }
}

/** Chemin courant côté serveur (URL de la requête SSR). */
export function getServerPath(): string {
  try {
    return getRequestUrl().pathname || "/";
  } catch {
    return "/";
  }
}

/** Alias de getSafeServerOrigin pour les contextes de paiement. */
export const getSafePaymentOrigin = getSafeServerOrigin;
