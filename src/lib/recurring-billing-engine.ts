// ============================================================================
// Allô Techno — Moteur de Facturation Récurrente B2B & Conformité e-MECeF DGI
// Gestion des abonnements de flotte, prélèvements MoMo / SEPA et relances.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";

export interface RecurringSubscription {
  subscriptionId: string;
  clientCompanyName: string;
  clientIfu: string;
  planName: "SLA Platine (50 Postes)" | "SLA Gold (20 Postes)" | "SLA Silver (10 Postes)";
  monthlyAmountFcfa: number;
  billingCycle: "mensuel" | "trimestriel" | "annuel";
  paymentMethod: "momo_b2b_auto" | "virement_bancaire" | "prelevement_sepa";
  lastInvoiceMecefCode: string;
  nextBillingDate: string;
  status: "actif" | "en_attente_paiement" | "suspendu";
}

export const MOCK_SUBSCRIPTIONS: RecurringSubscription[] = [
  {
    subscriptionId: "SUB-B2B-01",
    clientCompanyName: "Cabinet Me Koffi & Associés",
    clientIfu: "3201948201948",
    planName: "SLA Gold (20 Postes)",
    monthlyAmountFcfa: 250000,
    billingCycle: "mensuel",
    paymentMethod: "momo_b2b_auto",
    lastInvoiceMecefCode: "MECeF-BJ-2026-849102-X",
    nextBillingDate: "01 Septembre 2026",
    status: "actif",
  },
  {
    subscriptionId: "SUB-B2B-02",
    clientCompanyName: "Banque Atlantique Bénin (Direction Réseau)",
    clientIfu: "0201839201839",
    planName: "SLA Platine (50 Postes)",
    monthlyAmountFcfa: 650000,
    billingCycle: "trimestriel",
    paymentMethod: "virement_bancaire",
    lastInvoiceMecefCode: "MECeF-BJ-2026-904128-B",
    nextBillingDate: "01 Octobre 2026",
    status: "actif",
  },
];

export const getB2bSubscriptionsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    subscriptions: RecurringSubscription[];
    totalMrrFcfa: number;
    collectionRatePercent: number;
  }> => {
    const totalMrr = MOCK_SUBSCRIPTIONS.reduce((acc, sub) => acc + sub.monthlyAmountFcfa, 0);
    return {
      subscriptions: MOCK_SUBSCRIPTIONS,
      totalMrrFcfa: totalMrr,
      collectionRatePercent: 99.4,
    };
  },
);
