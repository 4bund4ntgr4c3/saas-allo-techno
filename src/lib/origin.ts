// Origine fonctionnelle du déploiement (worker Cloudflare) — le domaine
// canonique allotechno.africa n'a pas encore de DNS (sept. 2026).
export const DEFAULT_ORIGIN = "https://saas-allo-techno.4bund4ntgr4c3.workers.dev";

// Hôtes acceptés pour dériver les URLs construites côté serveur (redirections
// / callbacks de paiement, sitemap). Le host d'une requête Worker est
// contrôlable par le client : sans allowlist, un attaquant pourrait faire
// pointer les redirections post-paiement vers un domaine hostile (phishing).
// Tout hôte hors liste retombe sur DEFAULT_ORIGIN.
const ALLOWED_HOST_RE = /(^|\.)(allotechno\.africa|workers\.dev)$/;
const DEV_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/** Retourne l'origine si son hôte est autorisé, sinon DEFAULT_ORIGIN. */
export function safeOriginFromHostname(origin: string): string {
  const host = new URL(origin).hostname;
  return DEV_HOSTS.has(host) || ALLOWED_HOST_RE.test(host) ? origin : DEFAULT_ORIGIN;
}

/**
 * Chemin courant, côté client (navigation). Toujours au moins "/".
 * En SSR, utiliser `match.pathname` ou origin.server#getServerPath.
 */
export function getCurrentPath(): string {
  if (typeof window !== "undefined") return window.location.pathname || "/";
  return "/";
}
