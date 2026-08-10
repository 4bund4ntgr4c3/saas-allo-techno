import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

export type NewsletterSubscriber = {
  id: string;
  email: string;
  locale: string;
  subscribed_at: string;
  active: boolean;
};

/** Inscrit un email à la newsletter. */
export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { email, locale } = data as { email: string; locale: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Email invalide.");
    }
    return { email: email.toLowerCase().trim(), locale: locale ?? "fr" };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!rateLimit("newsletter", 5)) throw new Error("Trop de demandes. Réessayez dans 1 minute.");

    const { error } = await supabaseAdmin.from("newsletter_subscribers" as never).upsert(
      {
        email: data.email,
        locale: data.locale,
        active: true,
      } as never,
      { onConflict: "email" } as never,
    );
    if (error) throw new Error(error.message);
    return { subscribed: true };
  });
