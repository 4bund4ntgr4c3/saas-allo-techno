import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n/context";
import { contactSchema, type ContactInput } from "@/lib/reservation-schema";
import "@/lib/i18n/segments/reservation";

type Props = {
  defaultValues: Partial<ContactInput>;
  submitLabel: string;
  onValid: (contact: ContactInput) => void;
};

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-4 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function RadioChips({
  name,
  legend,
  options,
  value,
  register,
  error,
}: {
  name: "paiement";
  legend: string;
  options: { value: string; label: string; hint?: string }[];
  value: string;
  register: UseFormRegister<ContactInput>;
  error: string | undefined;
}) {
  return (
    <fieldset>
      <legend className="at-eyebrow mb-2 block">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer items-center gap-3 border p-3 transition-colors ${
                on ? "border-primary bg-primary/10" : "border-border hover:border-foreground"
              }`}
            >
              <input type="radio" value={o.value} {...register(name)} className="sr-only" />
              <span
                aria-hidden="true"
                className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                  on ? "border-primary" : "border-border"
                }`}
              >
                {on && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span>
                <span className="block text-sm font-bold tracking-tight">{o.label}</span>
                {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-1 font-mono text-[10px] uppercase text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Formulaire « dossier client » de la réservation : nom, téléphone, e-mail,
 * mode de dépôt, paiement et précisions. Profil pré-rempli si connecté.
 */
export function ContactForm({ defaultValues, submitLabel, onValid }: Props) {
  const { user } = useSession();
  const { t } = useI18n();
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.full_name) setValue("nom", data.full_name);
        if (data.phone) setValue("telephone", data.phone);
        setValue("email", data.email ?? user.email ?? "");
      });
  }, [user, setValue]);

  const err = (k: keyof ContactInput) => {
    const message = errors[k]?.message;
    if (!message) return null;
    return (
      <p
        id={`cf-${k}-error`}
        role="alert"
        className="mt-1 font-mono text-[10px] uppercase text-destructive"
      >
        {message}
      </p>
    );
  };

  return (
    <form noValidate onSubmit={handleSubmit(onValid)} className="border border-border bg-card p-8">
      <span className="at-eyebrow mb-3 block">{t("wizard.contact.eyebrow")}</span>
      <h2 className="at-display text-2xl">{t("wizard.contact.title")}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{t("wizard.contact.hint")}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="cf-nom" className="at-eyebrow mb-2 block">
            {t("wizard.contact.nom")}
          </label>
          <input
            id="cf-nom"
            className={field}
            aria-required="true"
            aria-invalid={errors.nom ? true : undefined}
            aria-describedby={errors.nom ? "cf-nom-error" : undefined}
            {...register("nom")}
          />
          {err("nom")}
        </div>
        <div>
          <label htmlFor="cf-telephone" className="at-eyebrow mb-2 block">
            {t("wizard.contact.telephone")}
          </label>
          <input
            id="cf-telephone"
            inputMode="tel"
            className={field}
            placeholder="+229 01 …"
            aria-required="true"
            aria-invalid={errors.telephone ? true : undefined}
            aria-describedby={errors.telephone ? "cf-telephone-error" : undefined}
            {...register("telephone")}
          />
          {err("telephone")}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="cf-email" className="at-eyebrow mb-2 block">
            {t("wizard.contact.email")}
          </label>
          <input
            id="cf-email"
            type="email"
            className={field}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "cf-email-error" : undefined}
            {...register("email")}
          />
          {err("email")}
        </div>

        <div className="md:col-span-2">
          <RadioChips
            name="paiement"
            legend={t("wizard.contact.payment")}
            value={watch("paiement") ?? ""}
            register={register}
            error={errors.paiement?.message}
            options={[
              { value: "mtn", label: "MTN Mobile Money" },
              { value: "moov", label: "Moov Money" },
              { value: "celtiis", label: "Celtiis" },
              { value: "especes", label: t("wizard.contact.payment.cash") },
            ]}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="cf-message" className="at-eyebrow mb-2 block">
            {t("wizard.contact.precision")}
          </label>
          <textarea
            id="cf-message"
            rows={3}
            className="w-full rounded-sm border border-border bg-card p-4 text-sm focus:border-primary focus:outline-none"
            {...register("message")}
          />
        </div>
      </div>

      <Button type="submit" variant="primaryBlock" size="lg" className="mt-8 w-full">
        {submitLabel} <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
