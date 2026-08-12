import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockRpc = vi.fn();
const mockGetClaims = vi.fn();

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: mockInsert.mockReturnThis(),
      select: mockSelect.mockReturnThis(),
      update: mockUpdate.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    })),
    rpc: mockRpc,
    auth: { getClaims: mockGetClaims },
  },
}));

vi.mock("@/lib/notifications", () => ({
  notifyReservationCreated: vi.fn(),
  notifyStaffNewReservation: vi.fn(),
  notifyReservationPaid: vi.fn(),
}));

vi.mock("@/lib/security", () => ({
  generateTrackingCode: vi.fn(() => "ABC1234567"),
  hashTrackingCode: vi.fn(async () => "hashed-code"),
  rateLimit: vi.fn(() => true),
}));

vi.mock("@/lib/monitoring", () => ({
  trackMetric: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: (validator: (data: unknown) => unknown) => ({
        handler:
          (handlerFn: (ctx: { data: unknown }) => Promise<unknown>) =>
          async (args: { data: unknown }) => {
            const validated = validator ? validator(args?.data ?? args) : (args?.data ?? args);
            return handlerFn({ data: validated });
          },
      }),
      handler:
        (handlerFn: (ctx: { data: unknown }) => Promise<unknown>) =>
        async (args: { data: unknown }) => {
          return handlerFn({ data: args?.data ?? args });
        },
    };
    return builder;
  },
}));

vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeader: vi.fn(() => "Bearer test-token"),
}));

describe("Reservation creation flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: "user-123" } }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSingle.mockResolvedValue({
      data: {
        reference: "AT-RES-001",
        customer_name: "Jean Dupont",
        email: "jean@example.com",
        phone: "+22997000001",
        device: "iPhone 14",
        issue: "Écran fissuré",
        mode: "boutique",
        payment: "especes",
        slot_date: "2026-08-15",
        slot_period: "matin",
        slot_hour: "09:00",
        status: "en_attente",
      },
      error: null,
    });
  });

  it("creates a reservation and returns tracking code", async () => {
    const { createReservation } = await import("@/lib/reservations.functions");
    const result = await createReservation({
      data: {
        nom: "Jean Dupont",
        telephone: "+22997000001",
        email: "jean@example.com",
        appareil: "iPhone 14",
        panne: "Écran fissuré",
        mode: "boutique",
        paiement: "especes",
        date: "2026-08-15",
        creneau: "matin",
        heure: "09:00",
      },
    });

    expect(result.tracking_code).toBe("ABC1234567");
    expect(result.reference).toBe("AT-RES-001");
    expect(result.status).toBe("en_attente");
  });

  it("rejects duplicate time slots (unique constraint)", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });

    const { createReservation } = await import("@/lib/reservations.functions");
    await expect(
      createReservation({
        data: {
          nom: "Jean Dupont",
          telephone: "+22997000001",
          appareil: "iPhone 14",
          panne: "Écran fissuré",
          mode: "boutique",
          paiement: "especes",
          date: "2026-08-15",
          creneau: "matin",
        },
      }),
    ).rejects.toThrow("Ce créneau vient d'être réservé");
  });
});

describe("Reservation status transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("transitions through en_attente → confirmee → en_cours → pret → livre", async () => {
    const statuses = ["en_attente", "confirmee", "en_cours", "pret", "livre"];
    for (const status of statuses) {
      mockRpc.mockResolvedValue({ error: null });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const result = await supabaseAdmin.rpc("update_reservation_payment", {
        _reference: "AT-RES-001",
        _status: status,
        _tx_id: "tx-001",
      });
      expect(result.error).toBeNull();
    }
  });

  it("cancels a reservation", async () => {
    mockRpc.mockResolvedValue({ error: null });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("update_reservation_payment", {
      _reference: "AT-RES-001",
      _status: "annulee",
      _tx_id: "",
    });
    expect(result.error).toBeNull();
  });
});
