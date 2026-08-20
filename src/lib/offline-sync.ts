// ============================================================================
// Allô Techno Pro — Moteur Offline-First & Synchronisation Terrain
// Stockage local des actions techniciens (scans, tickets, statuts) en IndexedDB
// et synchronisation automatique en tâche de fond dès retour du réseau.
// ============================================================================

import { createLogger } from "@/lib/logger";

const logger = createLogger("offline-sync");
const QUEUE_STORAGE_KEY = "allotechno_offline_actions_queue_v1";

export interface OfflineAction<T = unknown> {
  id: string;
  actionType: "update_status" | "log_maintenance" | "create_ticket" | "scan_equipment";
  payload: T;
  createdAt: string;
  retryCount: number;
}

export function getOfflineQueue(): OfflineAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    const parsed: OfflineAction[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed) || parsed.length === 0) return parsed;
    // Nettoyage automatique : supprime les entrées >24h ou retry >5 (évite bannière persistante en ligne)
    const now = Date.now();
    const filtered = parsed.filter((a) => {
      const age = now - new Date(a.createdAt).getTime();
      if (Number.isNaN(age)) return false;
      if (age > 24 * 60 * 60 * 1000) return false;
      if (a.retryCount > 5) return false;
      return true;
    });
    if (filtered.length !== parsed.length) {
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
      } catch {
        /* ignore */
      }
      return filtered;
    }
    return parsed;
  } catch (err) {
    logger.error("Erreur lecture file offline", err as Error);
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineAction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    logger.error("Erreur ecriture file offline", err as Error);
  }
}

export function enqueueOfflineAction<T>(
  actionType: OfflineAction["actionType"],
  payload: T,
): OfflineAction<T> {
  const queue = getOfflineQueue();
  const newAction: OfflineAction<T> = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    actionType,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(newAction as OfflineAction);
  saveOfflineQueue(queue);
  logger.info("Action mise en file offline", { id: newAction.id, actionType });
  return newAction;
}

export function removeOfflineAction(actionId: string): void {
  const queue = getOfflineQueue();
  const updated = queue.filter((a) => a.id !== actionId);
  saveOfflineQueue(updated);
}

/**
 * Tente d'exécuter toutes les actions en attente de synchronisation.
 */
export async function flushOfflineQueue(
  executor: (action: OfflineAction) => Promise<boolean>,
): Promise<{ processed: number; remaining: number }> {
  if (!navigator.onLine) {
    return { processed: 0, remaining: getOfflineQueue().length };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { processed: 0, remaining: 0 };

  let processedCount = 0;
  const remainingQueue: OfflineAction[] = [];

  for (const action of queue) {
    try {
      const success = await executor(action);
      if (success) {
        processedCount++;
      } else {
        action.retryCount += 1;
        remainingQueue.push(action);
      }
    } catch (err) {
      logger.error("Erreur execution action offline", err as Error, { actionId: action.id });
      action.retryCount += 1;
      remainingQueue.push(action);
    }
  }

  saveOfflineQueue(remainingQueue);
  return { processed: processedCount, remaining: remainingQueue.length };
}
