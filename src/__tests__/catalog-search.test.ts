import { describe, it, expect } from "vitest";
import { normalizeText, searchDevices } from "@/lib/catalog-search";

describe("normalizeText", () => {
  it("lowercases", () => {
    expect(normalizeText("HELLO")).toBe("hello");
  });

  it("removes accents", () => {
    expect(normalizeText("écran")).toBe("ecran");
  });

  it("removes punctuation", () => {
    expect(normalizeText("l'iPhone 17 Pro")).toBe("liphone 17 pro");
  });

  it("collapses whitespace", () => {
    expect(normalizeText("  hello   world  ")).toBe("hello world");
  });
});

describe("searchDevices", () => {
  it("returns empty for empty query", () => {
    expect(searchDevices("")).toEqual([]);
  });

  it("finds devices by exact name", () => {
    const results = searchDevices("iPhone 17 Pro");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.device.name).toContain("iPhone 17 Pro");
  });

  it("finds devices by brand", () => {
    const results = searchDevices("Samsung");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.device.brand).toBe("samsung"));
  });

  it("finds devices by category", () => {
    const results = searchDevices("Tablette");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.device.category).toBe("Tablette"));
  });

  it("sorts by relevance (exact match first)", () => {
    const results = searchDevices("Galaxy A56");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.device.name).toContain("Galaxy A56");
  });

  it("handles mixed case in queries", () => {
    const results = searchDevices("GALAXY a56");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.device.name).toContain("Galaxy A56");
  });
});
