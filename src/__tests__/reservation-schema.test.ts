import { describe, it, expect } from "vitest";
import {
  isOpenNow,
  openWindowFor,
  slotHoursFor,
  periodOfHour,
  toIsoDate,
  formatDateFr,
  SLOT_PERIODS,
  ALL_SLOT_HOURS,
} from "@/lib/reservation-schema";

describe("openWindowFor", () => {
  it("returns hours for boutique on Monday", () => {
    const w = openWindowFor("boutique", 1);
    expect(w).toEqual(["08:30", "20:30"]);
  });

  it("returns null for Sunday (closed)", () => {
    expect(openWindowFor("boutique", 0)).toBeNull();
  });

  it("returns narrower hours for domicile on Saturday", () => {
    const w = openWindowFor("domicile", 6);
    expect(w).toEqual(["10:00", "15:00"]);
  });
});

describe("isOpenNow", () => {
  it("returns false on Sunday", () => {
    const sunday = new Date("2026-08-02T10:00:00"); // Sunday
    expect(isOpenNow(sunday)).toBe(false);
  });

  it("returns true during weekday business hours", () => {
    const monday = new Date("2026-08-03T10:00:00"); // Monday 10:00
    expect(isOpenNow(monday)).toBe(true);
  });

  it("returns false before opening", () => {
    const early = new Date("2026-08-03T07:00:00"); // Monday 07:00
    expect(isOpenNow(early)).toBe(false);
  });

  it("returns false after closing", () => {
    const late = new Date("2026-08-03T21:00:00"); // Monday 21:00
    expect(isOpenNow(late)).toBe(false);
  });
});

describe("slotHoursFor", () => {
  it("returns morning and afternoon slots for Monday", () => {
    const slots = slotHoursFor("boutique", 1);
    expect(slots).toContain("08:30");
    expect(slots).toContain("20:30");
  });

  it("returns empty for Sunday", () => {
    expect(slotHoursFor("boutique", 0)).toEqual([]);
  });
});

describe("periodOfHour", () => {
  it("returns matin for hours before 13", () => {
    expect(periodOfHour("08:30")).toBe("matin");
    expect(periodOfHour("12:00")).toBe("matin");
  });

  it("returns apres-midi for hours 13+", () => {
    expect(periodOfHour("13:30")).toBe("apres-midi");
    expect(periodOfHour("20:30")).toBe("apres-midi");
  });
});

describe("toIsoDate", () => {
  it("formats date as YYYY-MM-DD", () => {
    const d = new Date(2026, 0, 5); // Jan 5, 2026
    expect(toIsoDate(d)).toBe("2026-01-05");
  });

  it("pads single digits", () => {
    const d = new Date(2026, 11, 25); // Dec 25, 2026
    expect(toIsoDate(d)).toBe("2026-12-25");
  });
});

describe("formatDateFr", () => {
  it("formats ISO date in French", () => {
    const result = formatDateFr("2026-08-03");
    expect(result).toContain("lundi");
    expect(result).toContain("août");
    expect(result).toContain("2026");
  });
});

describe("constants", () => {
  it("has 2 slot periods", () => {
    expect(SLOT_PERIODS).toHaveLength(2);
  });

  it("ALL_SLOT_HOURS contains 12 entries", () => {
    expect(ALL_SLOT_HOURS).toHaveLength(12);
  });
});
