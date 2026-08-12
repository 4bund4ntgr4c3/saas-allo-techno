export type ApprovalTier = {
  tier: "auto" | "manager" | "executive";
  label: string;
  maxAmountFcfa: number;
  requiresDoubleValidation: boolean;
};

export const APPROVAL_TIERS: ApprovalTier[] = [
  {
    tier: "auto",
    label: "Validation Automatique (Seuil de courtoisie < 100 000 FCFA)",
    maxAmountFcfa: 100000,
    requiresDoubleValidation: false,
  },
  {
    tier: "manager",
    label: "Validation Manager Informatique / Responsable Site (100k - 500k FCFA)",
    maxAmountFcfa: 500000,
    requiresDoubleValidation: false,
  },
  {
    tier: "executive",
    label: "Validation Direction Générale / DAF (> 500 000 FCFA)",
    maxAmountFcfa: Infinity,
    requiresDoubleValidation: true,
  },
];

export function getRequiredApprovalTier(amountFcfa: number): ApprovalTier {
  if (amountFcfa <= 100000) return APPROVAL_TIERS[0]!;
  if (amountFcfa <= 500000) return APPROVAL_TIERS[1]!;
  return APPROVAL_TIERS[2]!;
}

export function canUserApproveQuote(opts: {
  amountFcfa: number;
  userRole: "owner" | "admin" | "member" | "manager" | "comptabilite";
}): { canApprove: boolean; requiredRoleLabel: string } {
  const tier = getRequiredApprovalTier(opts.amountFcfa);

  if (tier.tier === "auto") {
    return { canApprove: true, requiredRoleLabel: "Tous les rôles autorisés" };
  }

  if (tier.tier === "manager") {
    const isAllowed = ["owner", "admin", "manager"].includes(opts.userRole);
    return {
      canApprove: isAllowed,
      requiredRoleLabel: "Responsable IT ou Administrateur d'Entreprise",
    };
  }

  // Executive tier
  const isAllowed = ["owner", "admin"].includes(opts.userRole);
  return {
    canApprove: isAllowed,
    requiredRoleLabel: "Direction Générale ou Administrateur d'Organisation",
  };
}
