import { describe, it, expect } from "vitest";
import {
  generateTrackingCode,
  hashTrackingCode,
  verifyTrackingCode,
  safeEqual,
  rateLimit,
} from "@/lib/security";

describe("generateTrackingCode", () => {
  it("returns a 10-character code", () => {
    expect(generateTrackingCode()).toHaveLength(10);
  });

  it("only uses unambiguous characters", () => {
    const code = generateTrackingCode();
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{10}$/);
  });

  it("generates distinct codes", () => {
    const a = generateTrackingCode();
    const b = generateTrackingCode();
    expect(a).not.toBe(b);
  });
});

describe("hashTrackingCode / verifyTrackingCode", () => {
  it("verifies the correct code", async () => {
    const code = generateTrackingCode();
    const hash = await hashTrackingCode(code);
    expect(await verifyTrackingCode(code, hash)).toBe(true);
  });

  it("rejects a wrong code", async () => {
    const hash = await hashTrackingCode("ABC1234567");
    expect(await verifyTrackingCode("XYZ9876543", hash)).toBe(false);
  });

  it("rejects an empty stored hash", async () => {
    expect(await verifyTrackingCode("ABC1234567", null)).toBe(false);
  });

  it("is case-insensitive", async () => {
    const hash = await hashTrackingCode("abc1234567");
    expect(await verifyTrackingCode("ABC1234567", hash)).toBe(true);
  });
});

describe("safeEqual", () => {
  it("compares equal strings", () => {
    expect(safeEqual("a1b2c3", "a1b2c3")).toBe(true);
  });

  it("compares different strings", () => {
    expect(safeEqual("a1b2c3", "a1b2c4")).toBe(false);
  });

  it("rejects different lengths", () => {
    expect(safeEqual("a", "ab")).toBe(false);
  });
});

describe("rateLimit", () => {
  it("allows requests up to the limit and blocks after", () => {
    const ok = [];
    for (let i = 0; i < 3; i++) ok.push(rateLimit("rate-test-key", 3));
    expect(ok).toEqual([true, true, true]);
    expect(rateLimit("rate-test-key", 3)).toBe(false);
  });

  it("uses independent buckets per key", () => {
    expect(rateLimit("rate-other-key", 1)).toBe(true);
    expect(rateLimit("rate-other-key", 1)).toBe(false);
    expect(rateLimit("rate-test-key", 3)).toBe(false);
  });
});
