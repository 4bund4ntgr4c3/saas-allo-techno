import { afterEach, describe, expect, it, vi } from "vitest";
import { sendWhatsAppCloud } from "@/lib/whatsapp-cloud";
import { sendTransactionalSms, type SmsPayload } from "@/lib/sms-notifications";

function makePayload(overrides: Partial<SmsPayload> = {}): SmsPayload {
  return {
    recipientPhone: "90000000",
    type: "deposit_confirmed",
    reference: "REF-2026-0001",
    customerName: "Jean",
    extraData: { device: "iPhone 12" },
    ...overrides,
  };
}

const okResponse = () =>
  new Response(JSON.stringify({ messages: [{ id: "wamid.HBgT" }] }), { status: 200 });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("whatsapp-cloud", () => {
  it("renvoie not_configured sans token ni phone id", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await sendWhatsAppCloud(makePayload());
    expect(result).toEqual({ success: false, reason: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envoie le template dossier_enregistre avec les bons paramètres (E.164, 229 préfixé)", async () => {
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "token-test");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123456789");
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => okResponse());
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendWhatsAppCloud(makePayload());

    expect(result).toEqual({ success: true, messageId: "wamid.HBgT" });
    const call = fetchMock.mock.calls[0]!;
    const url = String(call[0]);
    const init = call[1] as RequestInit;
    expect(url).toBe("https://graph.facebook.com/v23.0/123456789/messages");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer token-test");
    const body = JSON.parse(init.body as string) as {
      messaging_product: string;
      to: string;
      template: {
        name: string;
        language: { code: string };
        components: { parameters: { text: string }[] }[];
      };
    };
    expect(body.messaging_product).toBe("whatsapp");
    expect(body.to).toBe("22990000000");
    expect(body.template.name).toBe("dossier_enregistre");
    expect(body.template.language.code).toBe("fr");
    expect(body.template.components[0]!.parameters.map((p) => p.text)).toEqual([
      "Jean",
      "iPhone 12",
      "REF-2026-0001",
      "https://allotechno.africa/fr/suivi?ref=REF-2026-0001",
      expect.stringContaining("229"),
    ]);
  });

  it("mappe chaque type de notification vers son template", async () => {
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "t");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "p");
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await sendWhatsAppCloud(
      makePayload({
        type: "quote_ready",
        extraData: { amountFcfa: 25000, quoteUrl: "https://allotechno.africa/fr/devis?ref=X" },
      }),
    );
    await sendWhatsAppCloud(makePayload({ type: "ready_for_pickup" }));
    await sendWhatsAppCloud(makePayload({ type: "warranty_reminder" }));

    const names = fetchMock.mock.calls.map(
      (call) =>
        (JSON.parse((call[1] as RequestInit).body as string) as { template: { name: string } })
          .template.name,
    ) as string[];
    expect(names).toEqual(["devis_prest", "appareil_prest", "rappel_garantie"]);
  });

  it("replie sur la simulation quand rien n'est configuré", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await sendTransactionalSms(makePayload());
    expect(result.success).toBe(true);
    expect(result.messageId).toContain("SMS-BJ-SIM");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
