import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitLead } from "@/lib/leads.functions";

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const label = "at-eyebrow mb-1 block";

export function LeadForm({
  source,
  title,
  description,
  defaultReference,
  messageLabel = "Votre message",
  messagePlaceholder = "Décrivez votre besoin…",
  showReference = false,
  successText,
}: {
  source: "devis" | "contact" | "suivi";
  title: string;
  description?: string;
  defaultReference?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  showReference?: boolean;
  successText: string;
}) {
  const submit = useServerFn(submitLead);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState(defaultReference ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const submitForm = async () => {
    if (name.trim().length < 1) {
      toast.error("Votre nom est requis.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      toast.error("Numéro de téléphone invalide.");
      return;
    }
    setPending(true);
    try {
      await submit({ data: { source, name, phone, email, reference, message } });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-2 border border-success/40 bg-success/10 p-6" role="status">
        <p className="flex items-center gap-2 text-sm font-bold text-success">
          <CheckCircle2 className="size-5" />
          Message envoyé
        </p>
        <p className="text-sm text-muted-foreground">{successText}</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 border border-border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submitForm();
      }}
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`${source}-name`}>
            Nom
          </label>
          <input
            id={`${source}-name`}
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label className={label} htmlFor={`${source}-phone`}>
            Téléphone (WhatsApp)
          </label>
          <input
            id={`${source}-phone`}
            className={field}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="01 23 45 67 89"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`${source}-email`}>
            E-mail <span className="font-normal text-muted-foreground">(facultatif)</span>
          </label>
          <input
            id={`${source}-email`}
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
          />
        </div>
        {showReference ? (
          <div>
            <label className={label} htmlFor={`${source}-reference`}>
              N° de dossier <span className="font-normal text-muted-foreground">(si connu)</span>
            </label>
            <input
              id={`${source}-reference`}
              className={`${field} font-mono uppercase`}
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase().slice(0, 30))}
              placeholder="AT-XXXX"
            />
          </div>
        ) : null}
      </div>

      <div>
        <label className={label} htmlFor={`${source}-message`}>
          {messageLabel}
        </label>
        <textarea
          id={`${source}-message`}
          className="min-h-28 w-full rounded-sm border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={messagePlaceholder}
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {pending ? "Envoi…" : "Envoyer"}
      </Button>
    </form>
  );
}