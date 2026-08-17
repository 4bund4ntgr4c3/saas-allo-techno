// ============================================================================
// Allô Techno Pro — Indice de Santé Matériel (Health Score & Durabilité)
// Calcul prédictif basé sur le statut opérationnel, l'âge du matériel,
// la couverture de garantie et l'historique d'interventions.
// ============================================================================

import type { EquipmentStatus } from "@/lib/org/org-equipment.functions";

export interface EquipmentHealthData {
  status: EquipmentStatus;
  created_at?: string | null;
  purchase_date?: string | null;
  warranty_expires_at?: string | null;
  interventions_count?: number;
}

export interface EquipmentHealthResult {
  score: number; // 0 to 100
  label: "Excellent" | "Bon" | "À Surveiller" | "Critique" | "Fin de vie";
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  recommendation: string;
}

export function computeEquipmentHealthScore(data: EquipmentHealthData): EquipmentHealthResult {
  let score = 90;

  // 1. Statut actuel
  switch (data.status) {
    case "garantie":
      score = 98;
      break;
    case "actif":
      score = 92;
      break;
    case "maintenance":
      score = 72;
      break;
    case "en_panne":
      score = 42;
      break;
    case "retire":
      score = 15;
      break;
  }

  // 2. Ancienneté de la machine (si purchase_date ou created_at fourni)
  const dateRef = data.purchase_date || data.created_at;
  if (dateRef) {
    const ageYears = (Date.now() - new Date(dateRef).getTime()) / (365.25 * 24 * 3600 * 1000);
    if (ageYears > 5) {
      score -= 22;
    } else if (ageYears > 3) {
      score -= 12;
    } else if (ageYears > 1.5) {
      score -= 5;
    }
  }

  // 3. Statut de garantie active (+5%) ou expirée
  if (data.warranty_expires_at) {
    const isWarrantyActive = new Date(data.warranty_expires_at).getTime() > Date.now();
    if (isWarrantyActive) {
      score = Math.min(100, score + 6);
    }
  }

  // 4. Pénalité sur historique de pannes répétées
  const pannes = data.interventions_count ?? 0;
  if (pannes >= 4) {
    score -= 20;
  } else if (pannes >= 2) {
    score -= 10;
  }

  // Bornage strict [5, 100]
  score = Math.max(5, Math.min(100, Math.round(score)));

  if (score >= 85) {
    return {
      score,
      label: "Excellent",
      color: "#16a34a",
      bgClass: "bg-emerald-500/10",
      textClass: "text-emerald-600 dark:text-emerald-400",
      borderClass: "border-emerald-500/30",
      recommendation:
        "Équipement en parfait état de marche. Maintenir les révisions trimestrielles.",
    };
  }

  if (score >= 70) {
    return {
      score,
      label: "Bon",
      color: "#2563eb",
      bgClass: "bg-blue-500/10",
      textClass: "text-blue-600 dark:text-blue-400",
      borderClass: "border-blue-500/30",
      recommendation: "Fonctionnement nominal. Nettoyage préventif et dépoussiérage recommandés.",
    };
  }

  if (score >= 50) {
    return {
      score,
      label: "À Surveiller",
      color: "#d97706",
      bgClass: "bg-amber-500/10",
      textClass: "text-amber-600 dark:text-amber-400",
      borderClass: "border-amber-500/30",
      recommendation:
        "Signes d'usure ou révisions requises. Prévoir un diagnostic technique complet.",
    };
  }

  if (score >= 25) {
    return {
      score,
      label: "Critique",
      color: "#dc2626",
      bgClass: "bg-destructive/10",
      textClass: "text-destructive",
      borderClass: "border-destructive/30",
      recommendation:
        "Matériel immobilisé ou en panne bloquante. Demande d'intervention urgente requise.",
    };
  }

  return {
    score,
    label: "Fin de vie",
    color: "#6b7280",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-border",
    recommendation:
      "Matériel obsolète ou réformé. Reconditionnement ou recyclage DEEE certifié Allô Techno.",
  };
}
