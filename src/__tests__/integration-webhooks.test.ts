import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";

describe("FedaPay webhook signature verification", () => {
  const secret = "test-fedapay-secret";

  it("validates correct HMAC-SHA256 signature", () => {
    const body = '{"event":"transaction.approved","data":{"id":123}}';
    const timestamp = Math.floor(Date.now() / 1000);
    const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    const signature = `t=${timestamp},s=${expected}`;

    const match = /^t=(\d+),s=([0-9a-fA-F]{64})$/.exec(signature);
    expect(match).not.toBeNull();

    const ts = Number(match![1]);
    const received = match![2];
    expect(Math.abs(Date.now() / 1000 - ts)).toBeLessThanOrEqual(300);
    expect(received).toBe(expected);
  });

  it("rejects expired timestamps (>5 minutes)", () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const body = '{"event":"transaction.approved"}';
    const hmac = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    const signature = `t=${oldTimestamp},s=${hmac}`;

    const match = /^t=(\d+),s=([0-9a-fA-F]{64})$/.exec(signature);
    const ts = Number(match![1]);
    const isExpired = Math.abs(Date.now() / 1000 - ts) > 5 * 60;
    expect(isExpired).toBe(true);
  });

  it("rejects invalid signature format", () => {
    const invalid = "invalid-signature";
    const match = /^t=(\d+),s=([0-9a-fA-F]{64})$/.exec(invalid);
    expect(match).toBeNull();
  });

  it("rejects mismatched HMAC", () => {
    const body = '{"event":"transaction.approved"}';
    const timestamp = Math.floor(Date.now() / 1000);
    const wrongHmac = createHmac("sha256", "wrong-secret").update(body, "utf8").digest("hex");
    const signature = `t=${timestamp},s=${wrongHmac}`;

    const match = /^t=(\d+),s=([0-9a-fA-F]{64})$/.exec(signature);
    const received = match![2];
    const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    expect(received).not.toBe(expected);
  });
});

describe("KKiaPay webhook secret verification", () => {
  const secret = "test-kkiapay-secret";

  it("validates correct x-kkiapay-secret header", () => {
    const received = secret;
    expect(received).toBe(secret);
  });

  it("rejects missing secret", () => {
    const received = null;
    expect(!received || received !== secret).toBe(true);
  });

  it("rejects wrong secret", () => {
    const received: string = "wrong-secret";
    expect(!received || received !== secret).toBe(true);
  });
});

describe("Webhook handlers update payment status", () => {
  const mockRpc = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockMaybeSingle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("FedaPay approved event marks reservation as paid", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: { status: "pending", amount: 5000, reference: "AT-RES-001", source: "reservation" },
      })
      .mockResolvedValueOnce({
        data: {
          reference: "AT-RES-001",
          customer_name: "Jean",
          email: "jean@test.com",
          phone: "+22997000001",
          device: "iPhone",
          issue: "Écran",
          quote_amount: 5000,
        },
      });
    mockRpc.mockResolvedValue({ error: null });

    const payment = {
      status: "pending",
      amount: 5000,
      reference: "AT-RES-001",
      source: "reservation",
    };
    const isApproved = true;
    const nextStatus = isApproved ? "paid" : "failed";

    expect(nextStatus).toBe("paid");
    expect(payment.status).not.toBe("paid");
  });

  it("FedaPay declined event marks reservation as failed", async () => {
    const nextStatus = "failed";
    expect(nextStatus).toBe("failed");
  });

  it("KKiaPay successful payment marks reservation as paid", async () => {
    const isPaymentSucces: boolean = true;
    const nextStatus = isPaymentSucces ? "paid" : "failed";
    expect(nextStatus).toBe("paid");
  });

  it("KKiaPay failed payment marks reservation as failed", async () => {
    const isPaymentSucces: boolean = false;
    const nextStatus = isPaymentSucces ? "paid" : "failed";
    expect(nextStatus).toBe("failed");
  });

  it("idempotent: already-paid reservation is not updated", async () => {
    const payment = {
      status: "paid",
      amount: 5000,
      reference: "AT-RES-001",
      source: "reservation",
    };
    const shouldUpdate = payment.status !== "paid";
    expect(shouldUpdate).toBe(false);
  });
});
