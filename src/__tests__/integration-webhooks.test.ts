import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  verifyFedaPaySignature,
  verifyKkiapaySecret,
  verifyFlutterwaveHash,
  processWebhookPayment,
  type WebhookPaymentRow,
} from "@/lib/payment-webhooks";

const { triggerWebhooks, notifyReservationPaid } = vi.hoisted(() => ({
  triggerWebhooks: vi.fn(),
  notifyReservationPaid: vi.fn(),
}));

vi.mock("@/lib/webhooks.functions", () => ({ triggerWebhooks }));
vi.mock("@/lib/notifications", () => ({ notifyReservationPaid }));

describe("verifyFedaPaySignature", () => {
  const secret = "test-fedapay-secret";

  it("accepte une signature HMAC-SHA256 valide dans la fenêtre de 5 minutes", () => {
    const body = '{"event":"transaction.approved","data":{"id":123}}';
    const timestamp = Math.floor(Date.now() / 1000);
    const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    expect(verifyFedaPaySignature(secret, `t=${timestamp},s=${expected}`, body)).toBe(true);
  });

  it("rejette les timestamps expirés (>5 minutes)", () => {
    const body = '{"event":"transaction.approved"}';
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const hmac = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    expect(verifyFedaPaySignature(secret, `t=${oldTimestamp},s=${hmac}`, body)).toBe(false);
  });

  it("rejette les signatures mal formées", () => {
    expect(verifyFedaPaySignature(secret, "invalid-signature", "{}")).toBe(false);
    expect(verifyFedaPaySignature(secret, null, "{}")).toBe(false);
  });

  it("rejette un HMAC calculé avec un mauvais secret", () => {
    const body = '{"event":"transaction.approved"}';
    const timestamp = Math.floor(Date.now() / 1000);
    const wrong = createHmac("sha256", "wrong-secret").update(body, "utf8").digest("hex");
    expect(verifyFedaPaySignature(secret, `t=${timestamp},s=${wrong}`, body)).toBe(false);
  });
});

describe("verifyKkiapaySecret", () => {
  const secret = "test-kkiapay-secret";

  it("accepte le secret correct", () => {
    expect(verifyKkiapaySecret(secret, secret)).toBe(true);
  });

  it("rejette l'absence de secret", () => {
    expect(verifyKkiapaySecret(secret, null)).toBe(false);
    expect(verifyKkiapaySecret(secret, "")).toBe(false);
  });

  it("rejette un mauvais secret", () => {
    expect(verifyKkiapaySecret(secret, "wrong-secret")).toBe(false);
  });
});

describe("verifyFlutterwaveHash", () => {
  const secret = "test-flutterwave-hash";

  it("accepte le verif-hash correct", () => {
    expect(verifyFlutterwaveHash(secret, secret)).toBe(true);
  });

  it("rejette un verif-hash absent ou incorrect", () => {
    expect(verifyFlutterwaveHash(secret, null)).toBe(false);
    expect(verifyFlutterwaveHash(secret, "wrong")).toBe(false);
  });
});

type DbCalls = {
  updates: Array<{ table: string; data: Record<string, unknown> }>;
  rpcs: Array<{ fn: string; args: Record<string, unknown> }>;
};

function makeDb(overrides?: {
  payment?: WebhookPaymentRow | null;
  reservation?: Record<string, unknown> | null;
  lead?: Record<string, unknown> | null;
  rpcError?: Record<string, unknown> | null;
  updateError?: Record<string, unknown> | null;
}) {
  const calls: DbCalls = { updates: [], rpcs: [] };
  const db = {
    calls,
    _rpcError: overrides?.rpcError ?? null,
    _updateError: overrides?.updateError ?? null,
    rpc: vi.fn((fn: string, args: Record<string, unknown>) => {
      calls.rpcs.push({ fn, args });
      return Promise.resolve({ error: db._rpcError });
    }),
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => {
              if (table === "payments") return { data: overrides?.payment ?? null, error: null };
              if (table === "reservations")
                return { data: overrides?.reservation ?? null, error: null };
              if (table === "leads") return { data: overrides?.lead ?? null, error: null };
              return { data: null, error: null };
            }),
          })),
          maybeSingle: vi.fn(async () => {
            if (table === "payments") return { data: overrides?.payment ?? null, error: null };
            if (table === "reservations")
              return { data: overrides?.reservation ?? null, error: null };
            if (table === "leads") return { data: overrides?.lead ?? null, error: null };
            return { data: null, error: null };
          }),
        })),
      })),
      update: vi.fn((data: Record<string, unknown>) => {
        calls.updates.push({ table, data });
        return { eq: vi.fn(async () => ({ error: db._updateError })) };
      }),
    })),
  };
  return db as unknown as SupabaseClient<Database> & { calls: DbCalls };
}

const PAID_PAYMENT: WebhookPaymentRow = {
  status: "pending",
  amount: 5000,
  reference: "AT-RES-001",
  source: "reservation",
};

describe("processWebhookPayment (code de production)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("réservation payée : RPC update_reservation_payment + notification client + webhook sortant", async () => {
    const db = makeDb({
      payment: PAID_PAYMENT,
      reservation: {
        reference: "AT-RES-001",
        customer_name: "Jean",
        email: "jean@test.com",
        phone: "+22997000001",
        device: "iPhone",
        quote_amount: 5000,
      },
    });

    const outcome = await processWebhookPayment(db, PAID_PAYMENT, "paid", "T-123", 5000);

    expect(outcome).toBe("ok");
    expect(db.calls.rpcs).toEqual([
      {
        fn: "update_reservation_payment",
        args: { _reference: "AT-RES-001", _status: "paid", _tx_id: "T-123" },
      },
    ]);
    expect(notifyReservationPaid).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "AT-RES-001",
        customer_name: "Jean",
        quote_amount: 5000,
      }),
    );
    expect(triggerWebhooks).toHaveBeenCalledWith("payment.received", {
      reference: "AT-RES-001",
      source: "reservation",
      amount: 5000,
      txId: "T-123",
    });
  });

  it("réservation en échec : RPC failed + webhook payment.failed, sans notification client", async () => {
    const db = makeDb({ payment: PAID_PAYMENT });

    const outcome = await processWebhookPayment(db, PAID_PAYMENT, "failed", "T-124", null);

    expect(outcome).toBe("ok");
    expect(db.calls.rpcs).toEqual([
      {
        fn: "update_reservation_payment",
        args: { _reference: "AT-RES-001", _status: "failed", _tx_id: "T-124" },
      },
    ]);
    expect(notifyReservationPaid).not.toHaveBeenCalled();
    expect(triggerWebhooks).toHaveBeenCalledWith("payment.failed", expect.anything());
  });

  it("paiement SLA : marque la ligne payments, sans toucher aux réservations", async () => {
    const db = makeDb({
      payment: { status: "pending", amount: 25000, reference: "SLA-C-01", source: "sla" },
    });

    const outcome = await processWebhookPayment(
      db,
      { status: "pending", amount: 25000, reference: "SLA-C-01", source: "sla" },
      "paid",
      "T-200",
      25000,
    );

    expect(outcome).toBe("ok");
    expect(db.calls.updates).toEqual([
      { table: "payments", data: { status: "paid", tx_id: "T-200" } },
    ]);
    expect(db.calls.rpcs).toEqual([]);
    expect(triggerWebhooks).toHaveBeenCalledWith("payment.received", {
      reference: "SLA-C-01",
      source: "sla",
      amount: 25000,
      txId: "T-200",
    });
  });

  it("commande boutique : RPC update_payment_status + lead marqué payé", async () => {
    const db = makeDb({
      payment: { status: "pending", amount: 12000, reference: "CMD-42", source: "boutique" },
      lead: { message: "Bonjour, je veux un iPhone" },
    });

    const outcome = await processWebhookPayment(
      db,
      { status: "pending", amount: 12000, reference: "CMD-42", source: "boutique" },
      "paid",
      "FW-1",
      12000,
    );

    expect(outcome).toBe("ok");
    expect(db.calls.rpcs).toEqual([
      {
        fn: "update_payment_status",
        args: { _reference: "CMD-42", _status: "paid", _tx_id: "FW-1" },
      },
    ]);
    expect(
      db.calls.updates.some(
        (u) => u.table === "leads" && String(u.data["message"]).includes("Paiement : Payé"),
      ),
    ).toBe(true);
    expect(triggerWebhooks).toHaveBeenCalledWith("payment.received", {
      reference: "CMD-42",
      source: "boutique",
      amount: 12000,
      txId: "FW-1",
    });
  });

  it("rejette un montant incohérent sans aucune écriture en base", async () => {
    const db = makeDb({ payment: PAID_PAYMENT });

    const outcome = await processWebhookPayment(db, PAID_PAYMENT, "paid", "T-300", 999);

    expect(outcome).toBe("amount_mismatch");
    expect(db.calls.rpcs).toEqual([]);
    expect(db.calls.updates).toEqual([]);
    expect(triggerWebhooks).not.toHaveBeenCalled();
  });

  it("transaction inconnue : retourne unknown sans écriture", async () => {
    const db = makeDb({ payment: null });

    const outcome = await processWebhookPayment(db, null, "paid", "T-400", 5000);

    expect(outcome).toBe("unknown");
    expect(db.calls.rpcs).toEqual([]);
    expect(triggerWebhooks).not.toHaveBeenCalled();
  });

  it("idempotent : un paiement déjà payé n'est jamais réécrit", async () => {
    const db = makeDb({ payment: { ...PAID_PAYMENT, status: "paid" } });

    const outcome = await processWebhookPayment(
      db,
      { ...PAID_PAYMENT, status: "paid" },
      "paid",
      "T-500",
      5000,
    );

    expect(outcome).toBe("ok");
    expect(db.calls.rpcs).toEqual([]);
    expect(db.calls.updates).toEqual([]);
    expect(triggerWebhooks).not.toHaveBeenCalled();
  });

  it("erreur RPC : retourne db_error", async () => {
    const db = makeDb({ payment: PAID_PAYMENT, rpcError: { message: "boom" } });

    const outcome = await processWebhookPayment(db, PAID_PAYMENT, "paid", "T-600", 5000);

    expect(outcome).toBe("db_error");
  });

  it("erreur update SLA : retourne db_error", async () => {
    const db = makeDb({
      payment: { status: "pending", amount: 25000, reference: "SLA-C-02", source: "sla" },
      updateError: { message: "boom" },
    });

    const outcome = await processWebhookPayment(
      db,
      { status: "pending", amount: 25000, reference: "SLA-C-02", source: "sla" },
      "paid",
      "T-700",
      25000,
    );

    expect(outcome).toBe("db_error");
  });
});
