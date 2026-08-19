import { getRequestHeader } from "@tanstack/react-start/server";
import { orgClient } from "./org-client";

/**
 * Version serveur de `orgClient` : extrait le JWT de la requête courante
 * (en-tête Authorization) avant de construire le client Supabase contextuel.
 * À utiliser UNIQUEMENT dans les handlers des server functions B2B.
 */
export async function requestOrgClient() {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Non authentifié");
  return orgClient(token);
}
