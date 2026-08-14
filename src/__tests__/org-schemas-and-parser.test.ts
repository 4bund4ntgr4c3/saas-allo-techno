import { describe, it, expect } from "vitest";
import {
  organizationInputSchema,
  equipmentInputSchema,
  siteInputSchema,
  maintenanceScheduleInputSchema,
} from "@/lib/org-schemas";
import { parseError } from "@/lib/error-parser";

describe("B2B Zod Schemas Validation", () => {
  describe("organizationInputSchema", () => {
    it("validates valid organization data", () => {
      const input = {
        name: "Banque Atlantique Bénin",
        trade_name: "BAB SA",
        registration_number: "RB/COT/26 B 999",
        country: "Bénin",
        email: "contact@banqueatlantique.bj",
      };
      const parsed = organizationInputSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    });

    it("rejects short or empty name", () => {
      const input = { name: "A" };
      const parsed = organizationInputSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });
  });

  describe("equipmentInputSchema", () => {
    it("validates valid equipment data", () => {
      const input = {
        org_id: "00000000-0000-0000-0000-000000000001",
        name: "Serveur Dell PowerEdge R740",
        type: "serveur" as const,
        brand: "Dell",
        model: "PowerEdge R740",
        serial_number: "SN-987654",
      };
      const parsed = equipmentInputSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid org_id UUID", () => {
      const input = {
        org_id: "not-a-uuid",
        name: "Laptop HP",
      };
      const parsed = equipmentInputSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });
  });

  describe("siteInputSchema", () => {
    it("validates site with departments array", () => {
      const input = {
        org_id: "00000000-0000-0000-0000-000000000001",
        name: "Agence Parakou — Hub Nord",
        city: "Parakou",
        departments: ["DSI", "Direction", "Comptabilité"],
      };
      const parsed = siteInputSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    });
  });

  describe("maintenanceScheduleInputSchema", () => {
    it("validates maintenance task with interval", () => {
      const input = {
        org_id: "00000000-0000-0000-0000-000000000001",
        equipment_id: "00000000-0000-0000-0000-000000000002",
        task_title: "Dépoussiérage et changement pâte thermique",
        interval_months: 6,
        next_due_at: "2026-11-15",
      };
      const parsed = maintenanceScheduleInputSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    });
  });
});

describe("Error Parser Security & Localization", () => {
  it("sanitizes raw PostgreSQL schema leak", () => {
    const rawError = new Error("syntax error at or near insert into public.reservations");
    const parsed = parseError(rawError);
    expect(parsed.message).toBe("Données invalides ou opération non conforme. Veuillez vérifier vos saisies.");
  });

  it("handles duplicate key violation", () => {
    const rawError = { code: "23505", message: "duplicate key value violates unique constraint" };
    const parsed = parseError(rawError);
    expect(parsed.code).toBe("DUPLICATE_ENTRY");
    expect(parsed.message).toBe("Cet enregistrement existe déjà dans le système.");
  });

  it("handles network disconnection", () => {
    const rawError = new Error("Failed to fetch");
    const parsed = parseError(rawError);
    expect(parsed.isNetworkError).toBe(true);
    expect(parsed.message).toContain("Connexion réseau instable");
  });
});
