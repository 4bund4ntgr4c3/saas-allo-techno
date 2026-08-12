export type SymptomInput = {
  deviceCategory: "smartphone" | "laptop" | "tablet" | "console" | "printer" | "server" | "desktop";
  brand: string;
  model: string;
  symptoms: string[];
};

export type DiagnosticResult = {
  estimatedCostRange: { min: number; max: number };
  probableFaults: string[];
  recommendedParts: string[];
  repairTimeEstimateHours: number;
  repairabilityScore: number; // 1-10
  adviceText: string;
};

export type HealthIndexInput = {
  ageMonths: number;
  previousRepairsCount: number;
  averageDailyUsageHours: number;
  environment: "office" | "field" | "industrial";
};

export type PredictiveHealthResult = {
  healthScore: number; // 0-100%
  failureProbabilityNext6Months: number; // 0-100%
  recommendedAction: "maintain" | "upgrade_part" | "replace_unit";
  riskFactors: string[];
  tcoEstimateFcfa: number;
};

export function runAiPreDiagnostic(input: SymptomInput): DiagnosticResult {
  const { deviceCategory, symptoms } = input;
  const hasDisplayIssue = symptoms.some((s) => s.includes("écran") || s.includes("tactile") || s.includes("noir"));
  const hasBatteryIssue = symptoms.some((s) => s.includes("batterie") || s.includes("charge") || s.includes("éteint"));

  let minCost = 15000;
  let maxCost = 35000;
  const probableFaults: string[] = [];
  const recommendedParts: string[] = [];

  if (hasDisplayIssue) {
    minCost += 20000;
    maxCost += 40000;
    probableFaults.push("Dalle d'affichage / Vitre tactile endommagée");
    recommendedParts.push("Bloc Écran OLED / LCD d'origine");
  }

  if (hasBatteryIssue) {
    minCost += 10000;
    maxCost += 15000;
    probableFaults.push("Cellule Batterie dégradée ou connecteur de charge oxydé");
    recommendedParts.push("Batterie Haute Capacité (Li-ion)", "Connecteur de Charge USB-C");
  }

  if (probableFaults.length === 0) {
    probableFaults.push("Dysfonctionnement logiciel ou carte mère nécessitant inspection atelier");
    recommendedParts.push("Passage sur banc de diagnostic électronique");
  }

  return {
    estimatedCostRange: { min: minCost, max: maxCost },
    probableFaults,
    recommendedParts,
    repairTimeEstimateHours: hasDisplayIssue ? 2 : 1,
    repairabilityScore: deviceCategory === "smartphone" ? 8 : 7,
    adviceText: "Diagnostic préliminaire généré avec succès. Présentez votre appareil en boutique Allô Techno pour confirmation sans engagement.",
  };
}

export function predictEquipmentFailureAi(input: HealthIndexInput): PredictiveHealthResult {
  let baseScore = 100;
  const riskFactors: string[] = [];

  // Deduct score based on age
  if (input.ageMonths > 36) {
    baseScore -= 30;
    riskFactors.push("Obsolescence matérielle (> 3 ans d'utilisation)");
  } else if (input.ageMonths > 24) {
    baseScore -= 15;
    riskFactors.push("Usage prolongé (2 à 3 ans d'ancienneté)");
  }

  // Deduct score based on previous repairs
  if (input.previousRepairsCount >= 3) {
    baseScore -= 25;
    riskFactors.push("Historique de pannes fréquentes (3+ réparations)");
  } else if (input.previousRepairsCount > 0) {
    baseScore -= 10;
  }

  // Deduct score based on environment
  if (input.environment === "industrial") {
    baseScore -= 20;
    riskFactors.push("Environnement soumis à la poussière et variations de température");
  } else if (input.environment === "field") {
    baseScore -= 10;
    riskFactors.push("Utilisation nomade / terrain");
  }

  const finalHealthScore = Math.max(10, Math.min(100, baseScore));
  const failureProb = Math.max(5, Math.min(95, 100 - finalHealthScore));

  let recommendedAction: PredictiveHealthResult["recommendedAction"] = "maintain";
  if (finalHealthScore < 45) {
    recommendedAction = "replace_unit";
  } else if (finalHealthScore < 70) {
    recommendedAction = "upgrade_part";
  }

  const tcoEstimate = Math.round((input.ageMonths * 4500) + (input.previousRepairsCount * 25000));

  return {
    healthScore: finalHealthScore,
    failureProbabilityNext6Months: failureProb,
    recommendedAction,
    riskFactors,
    tcoEstimateFcfa: tcoEstimate,
  };
}
