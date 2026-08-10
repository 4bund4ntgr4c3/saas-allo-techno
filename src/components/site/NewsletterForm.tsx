import { useState } from "react";
import { Send } from "lucide-react";
import { subscribeNewsletter } from "@/lib/newsletter.functions";
import { useI18n } from "@/lib/i18n/context";

export function NewsletterForm() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await subscribeNewsletter({ data: { email, locale } });
      setStatus("ok");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="at-eyebrow mb-2 text-foreground">{t("footer.newsletter.title")}</h3>
      <p className="mb-4 text-xs text-muted-foreground">{t("footer.newsletter.description")}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          {t("footer.newsletter.placeholder")}
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder={t("footer.newsletter.placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-xs font-mono placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="size-3" />
          {status === "loading" ? "..." : t("footer.newsletter.cta")}
        </button>
      </form>
      {status === "ok" && (
        <p className="mt-2 text-[11px] text-success">{t("footer.newsletter.success")}</p>
      )}
      {status === "error" && (
        <p className="mt-2 text-[11px] text-destructive">{t("footer.newsletter.error")}</p>
      )}
    </div>
  );
}
