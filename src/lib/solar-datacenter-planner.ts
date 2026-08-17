// ============================================================================
// Allô Techno — Simulateur Solaire & Autonomie Baie Serveurs / Datacenter
// Dimensionnement des panneaux photovoltaïques et batteries LiFePO4 face aux coupures.
// ============================================================================

export interface SolarSystemRecommendation {
  totalPowerLoadWatts: number;
  dailyEnergyKwh: number;
  solarPanelsKwc: number;
  solarPanelsCount450w: number;
  batteryCapacityKwh: number;
  lifepo4PackCount48v100ah: number;
  hybridInverterKva: number;
  autonomyHoursWithoutSun: number;
  estimatedInvestmentFcfa: number;
  sbeeDieselYearlySavingsFcfa: number;
  roiPaybackYears: number;
}

export function calculateSolarItSetup(
  serverRackCount: number,
  averageLoadPerRackWatts: number = 800,
  desiredAutonomyHours: number = 18,
): SolarSystemRecommendation {
  const totalWatts = serverRackCount * averageLoadPerRackWatts;
  const dailyKwh = (totalWatts * 24) / 1000;
  const autonomyKwh = (totalWatts * desiredAutonomyHours) / 1000;

  // Sizing with 20% safety margin and 85% battery DoD (Depth of Discharge)
  const batteryKwh = Math.ceil((autonomyKwh / 0.85) * 1.1);
  const batteryPackCount = Math.ceil((batteryKwh * 1000) / (48 * 100)); // packs 48V 100Ah = 4.8kWh
  const solarPanelsKwc = Math.round((dailyKwh / 4.5) * 1.25 * 10) / 10; // 4.5h peak sun hours Bénin
  const panelsCount = Math.ceil((solarPanelsKwc * 1000) / 450);
  const inverterKva = totalWatts > 3000 ? 10 : 5;

  const totalInvestment = 1800000 + batteryPackCount * 650000 + panelsCount * 85000;
  const sbeeDieselYearlySavings = dailyKwh * 365 * 180; // 180 FCFA/kWh mix SBEE + Carburant Groupe
  const roiYears = Math.round((totalInvestment / sbeeDieselYearlySavings) * 10) / 10;

  return {
    totalPowerLoadWatts: totalWatts,
    dailyEnergyKwh: Math.round(dailyKwh * 10) / 10,
    solarPanelsKwc,
    solarPanelsCount450w: panelsCount,
    batteryCapacityKwh: batteryKwh,
    lifepo4PackCount48v100ah: batteryPackCount,
    hybridInverterKva: inverterKva,
    autonomyHoursWithoutSun: desiredAutonomyHours,
    estimatedInvestmentFcfa: totalInvestment,
    sbeeDieselYearlySavingsFcfa: sbeeDieselYearlySavings,
    roiPaybackYears: roiYears,
  };
}
