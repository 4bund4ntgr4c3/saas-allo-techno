import { describe, it, expect } from "vitest";
import { parseError } from "@/lib/error-parser";

describe("Error Parser Security & Localization", () => {
  it("sanitizes raw PostgreSQL schema leak", () => {
    const rawError = new Error("syntax error at or near insert into public.reservations");
    const parsed = parseError(rawError);
    expect(parsed.message).toBe(
      "Données invalides ou opération non conforme. Veuillez vérifier vos saisies.",
    );
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
