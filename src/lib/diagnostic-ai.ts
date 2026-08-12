export type SymptomInput = {
  deviceCategory: "smartphone" | "laptop" | "tablet" | "console";
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
