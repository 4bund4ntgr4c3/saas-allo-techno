import { describe, it, expect } from "vitest";
import {
  familyOf,
  brandBySlug,
  devicesOfBrand,
  deviceBySlug,
  brandName,
  BRANDS,
  DEVICES,
} from "@/data/catalog";

describe("familyOf", () => {
  it("removes brand prefix", () => {
    expect(familyOf("Samsung Galaxy A56 5G")).toBe("Galaxy A5x");
  });

  it("removes Pro/Max/Plus variants", () => {
    expect(familyOf("iPhone 17 Pro Max")).toBe("iPhone 17");
  });

  it("handles Galaxy Watch Ultra", () => {
    expect(familyOf("Samsung Galaxy Watch Ultra")).toBe("Galaxy Watch Ultra");
  });

  it("simplifies Galaxy A series to A1x format", () => {
    expect(familyOf("Samsung Galaxy A34 5G")).toBe("Galaxy A3x");
  });

  it("removes trailing letter variants", () => {
    expect(familyOf("Tecno Spark 30C")).toBe("Spark 30");
  });

  it("handles Xiaomi numbered series", () => {
    expect(familyOf("Xiaomi 15 Pro")).toBe("15");
  });

  it("groups HP Laptop years into one family", () => {
    expect(familyOf("HP Laptop 14")).toBe("Laptop 14");
    expect(familyOf("HP Laptop 14 (2018)")).toBe("Laptop 14");
    expect(familyOf("HP Laptop 14 (2022)")).toBe("Laptop 14");
    expect(familyOf("HP Laptop 15 (2020)")).toBe("Laptop 15");
  });

  it("groups HP generations into one family", () => {
    expect(familyOf("HP EliteBook 820 G3")).toBe("EliteBook 820");
    expect(familyOf("HP EliteBook 820 G4")).toBe("EliteBook 820");
    expect(familyOf("HP EliteBook 840 G10")).toBe("EliteBook 840");
    expect(familyOf("HP ProBook 440 G9")).toBe("ProBook 440");
  });
});

describe("brandBySlug", () => {
  it("finds Apple", () => {
    const b = brandBySlug("apple");
    expect(b).toBeDefined();
    expect(b!.name).toBe("Apple");
  });

  it("returns undefined for unknown slug", () => {
    expect(brandBySlug("unknown")).toBeUndefined();
  });
});

describe("devicesOfBrand", () => {
  it("returns Apple devices", () => {
    const devices = devicesOfBrand("apple");
    expect(devices.length).toBeGreaterThan(0);
    devices.forEach((d) => expect(d.brand).toBe("apple"));
  });

  it("returns empty for unknown brand", () => {
    expect(devicesOfBrand("unknown")).toEqual([]);
  });
});

describe("deviceBySlug", () => {
  it("finds a device by slug", () => {
    const d = deviceBySlug("iphone-17-pro");
    expect(d).toBeDefined();
    expect(d!.name).toContain("iPhone 17 Pro");
  });

  it("returns undefined for unknown slug", () => {
    expect(deviceBySlug("nonexistent")).toBeUndefined();
  });
});

describe("brandName", () => {
  it("returns brand name for known slug", () => {
    expect(brandName("samsung")).toBe("Samsung");
  });

  it("returns slug for unknown brand", () => {
    expect(brandName("unknown")).toBe("unknown");
  });
});

describe("catalog data integrity", () => {
  it("has 28 brands", () => {
    expect(BRANDS.length).toBe(28);
  });

  it("has unique devices", () => {
    const slugs = DEVICES.map((d) => d.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("every device has required fields", () => {
    DEVICES.forEach((d) => {
      expect(d.slug).toBeTruthy();
      expect(d.name).toBeTruthy();
      expect(d.brand).toBeTruthy();
      expect(d.series).toBeTruthy();
      expect(d.category).toBeTruthy();
      expect(d.year).toBeGreaterThan(2000);
      expect(Array.isArray(d.faults)).toBe(true);
    });
  });

  it("every brand slug exists in BRANDS", () => {
    const brandSlugs = new Set(BRANDS.map((b) => b.slug));
    DEVICES.forEach((d) => {
      expect(brandSlugs.has(d.brand)).toBe(true);
    });
  });
});
