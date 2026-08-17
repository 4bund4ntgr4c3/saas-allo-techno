import { describe, it, expect } from "vitest";
import { calculateTradeInValue } from "@/lib/trade-in";
import { getCurrentTropicalClimateAdvisory } from "@/lib/tropical-climate-advisor";
import { detectMomoProvider } from "@/components/shop/MobileMoneyDirectPay";

describe("Allô Techno — Tests des Outils Avancés (Batches 44-48)", () => {
  describe("1. Simulateur Trade-In & Argus", () => {
    it("calcule correctement la valeur de reprise avec bonus +10%", () => {
      const result = calculateTradeInValue({
        modelId: "macbook-air-m1",
        cosmetic: "comme_neuf",
        functional: "parfait",
        hasCharger: true,
      });

      expect(result.estimatedValueFcfa).toBeGreaterThan(200000);
      expect(result.bonusVoucherFcfa).toBe(
        Math.round((result.estimatedValueFcfa * 0.1) / 500) * 500,
      );
      expect(result.totalVoucherFcfa).toBe(result.estimatedValueFcfa + result.bonusVoucherFcfa);
    });

    it("applique une décote correcte pour écran fissuré", () => {
      const intact = calculateTradeInValue({
        modelId: "iphone-14-pro",
        cosmetic: "bon_etat",
        functional: "parfait",
        hasCharger: false,
      });

      const cracked = calculateTradeInValue({
        modelId: "iphone-14-pro",
        cosmetic: "bon_etat",
        functional: "ecran_fissure",
        hasCharger: false,
      });

      expect(cracked.estimatedValueFcfa).toBeLessThan(intact.estimatedValueFcfa * 0.6);
    });
  });

  describe("2. Conseiller Préventif Climat Tropical", () => {
    it("détecte la saison de l'Harmattan en décembre/janvier", () => {
      const advDec = getCurrentTropicalClimateAdvisory(12);
      expect(advDec.seasonKey).toBe("harmattan");
      expect(advDec.riskFactor).toBe("Élevé");
      expect(advDec.mainThreats[0]).toContain("radiateurs");
    });

    it("détecte la saison des pluies en juin/juillet", () => {
      const advJune = getCurrentTropicalClimateAdvisory(6);
      expect(advJune.seasonKey).toBe("mousson_pluie");
      expect(advJune.riskFactor).toBe("Critique");
      expect(advJune.mainThreats[0]).toContain("oxydation");
    });
  });

  describe("3. Détection Opérateur Mobile Money Bénin (+229)", () => {
    it("identifie les numéros MTN Bénin", () => {
      expect(detectMomoProvider("61001122")).toBe("mtn");
      expect(detectMomoProvider("97887766")).toBe("mtn");
      expect(detectMomoProvider("22966112233")).toBe("mtn");
    });

    it("identifie les numéros Moov Money Bénin", () => {
      expect(detectMomoProvider("95001122")).toBe("moov");
      expect(detectMomoProvider("64332211")).toBe("moov");
      expect(detectMomoProvider("22994556677")).toBe("moov");
    });

    it("identifie les numéros Celtiis Cash Bénin", () => {
      expect(detectMomoProvider("40112233")).toBe("celtiis");
      expect(detectMomoProvider("90123456")).toBe("celtiis");
    });
  });
});
