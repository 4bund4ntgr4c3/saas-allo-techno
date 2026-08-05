import { describe, it, expect } from "vitest";
import { computeEstimate, SERVICE_FEE, WARRANTY_RATE } from "@/lib/estimate";
import type { Fault } from "@/data/catalog";

const mockFault: Fault = {
  slug: "ecran-casse",
  label: "Écran cassé",
  price: 50000,
  duration: "45 min",
  warranty: "6 mois",
  part: "Dalle OLED",
};

const mockFault2: Fault = {
  slug: "batterie",
  label: "Batterie gonflée",
  price: 25000,
  duration: "30 min",
  warranty: "3 mois",
  part: "Batterie Li-Po",
};

describe("computeEstimate", () => {
  it("returns zero estimate for empty faults", () => {
    const est = computeEstimate([]);
    expect(est.parts).toBe(0);
    expect(est.labor).toBe(0);
    expect(est.service).toBe(0);
    expect(est.warranty).toBe(0);
    expect(est.total).toBe(0);
  });

  it("splits price into parts and labor", () => {
    const est = computeEstimate([mockFault]);
    const base = 50000;
    expect(est.parts + est.labor).toBe(base);
  });

  it("adds service fee when faults exist", () => {
    const est = computeEstimate([mockFault]);
    expect(est.service).toBe(SERVICE_FEE);
  });

  it("no service fee for empty faults", () => {
    const est = computeEstimate([]);
    expect(est.service).toBe(0);
  });

  it("calculates warranty correctly", () => {
    const est = computeEstimate([mockFault]);
    const expectedWarranty = Math.round((50000 * WARRANTY_RATE) / 100) * 100;
    expect(est.warranty).toBe(expectedWarranty);
  });

  it("total = base + service + warranty", () => {
    const est = computeEstimate([mockFault, mockFault2]);
    const base = 50000 + 25000;
    expect(est.total).toBe(base + est.service + est.warranty);
  });

  it("rounds parts and warranty to nearest 100", () => {
    const fault: Fault = { ...mockFault, price: 33333 };
    const est = computeEstimate([fault]);
    expect(est.parts % 100).toBe(0);
    expect(est.warranty % 100).toBe(0);
  });
});
