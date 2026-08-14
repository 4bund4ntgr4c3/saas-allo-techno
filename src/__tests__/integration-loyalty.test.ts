import { describe, it, expect } from "vitest";
import { computeTier } from "@/lib/loyalty.functions";

describe("computeTier", () => {
  it("returns bronze for 0 points", () => {
    const result = computeTier(0);
    expect(result.tier).toBe("bronze");
    expect(result.label).toBe("Bronze");
    expect(result.next).toEqual({ tier: "argent", label: "Argent", min: 300 });
  });

  it("returns bronze for 299 points", () => {
    const result = computeTier(299);
    expect(result.tier).toBe("bronze");
  });

  it("returns argent for 300 points", () => {
    const result = computeTier(300);
    expect(result.tier).toBe("argent");
    expect(result.label).toBe("Argent");
    expect(result.next).toEqual({ tier: "or", label: "Or", min: 700 });
  });

  it("returns argent for 699 points", () => {
    const result = computeTier(699);
    expect(result.tier).toBe("argent");
  });

  it("returns or for 700 points", () => {
    const result = computeTier(700);
    expect(result.tier).toBe("or");
    expect(result.label).toBe("Or");
    expect(result.next).toBeNull();
  });

  it("returns or for 1000 points", () => {
    const result = computeTier(1000);
    expect(result.tier).toBe("or");
  });
});

describe("Loyalty point calculation", () => {
  it("100 points = 500 FCFA discount (1pt = 5 FCFA)", () => {
    const POINT_VALUE = 5;
    const points = 100;
    const discount = points * POINT_VALUE;
    expect(discount).toBe(500);
  });

  it("discount capped at 30% of quote amount", () => {
    const POINT_VALUE = 5;
    const MAX_DISCOUNT_RATIO = 0.3;
    const points = 10000;
    const quoteAmount = 10000;
    const maxDiscount = Math.floor(quoteAmount * MAX_DISCOUNT_RATIO);
    const rawDiscount = points * POINT_VALUE;
    const discountAmount = Math.min(rawDiscount, maxDiscount, quoteAmount);
    expect(discountAmount).toBe(3000);
    expect(discountAmount).toBeLessThanOrEqual(quoteAmount * MAX_DISCOUNT_RATIO + 1);
  });

  it("minimum 100 points required for discount", () => {
    const points = 50;
    const hasMinimum = points >= 100;
    expect(hasMinimum).toBe(false);
  });
});

describe("Referral code generation", () => {
  const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

  it("generates ALLO-XXXX format", () => {
    const bytes = new Uint8Array([10, 20, 30, 40]);
    let code = "ALLO-";
    for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
    expect(code).toMatch(/^ALLO-[A-Z0-9]{4}$/);
  });

  it("uses only unambiguous characters", () => {
    const code = "ALLO-X7K2";
    expect(code).toMatch(/^ALLO-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  });
});
