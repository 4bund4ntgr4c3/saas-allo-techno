import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { CtaBand, MobileMoneyBar, ProcessSteps, SectionHeader } from "@/components/site/Blocks";
import { BRANDS, CATEGORIES, DEVICES, formatFcfa } from "@/data/catalog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reservation")({
  validateSearch: (search: Record<string, unknown>) => ({
    device: typeof search.device === "string" ? search.device : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Réserver une réparation — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Réservez votre créneau de réparation à Abomey-Calavi : dépôt en boutique ou enlèvement à domicile, confirmation par WhatsApp.",
      },
      { property: "og:title", content: "Réserver une réparation — Allô Techno" },
      {
        property: "og:description",
        content: "Choisissez votre appareil, votre panne et votre créneau en moins de 2 minutes.",
      },
      { property: "og:url", content: "/reservation" },
    ],
    links: [{ rel: "canonical", href: "/reservation" }],
  }),
  component: Reservation,
});

const schema = z.object({
  nom: z.string().trim().min(2, "Nom trop court").max(80),
  telephone: z
    .string()
    .trim()
    .min(8, "Numéro invalide")
    .max(20)
    .regex(/^[0-9+\s]+$/, "Chiffres uniquement"),
  email: z.string().trim().email("E-mail invalide").max(180).optional().or(z.literal("")),
  appareil: z.string().min(1, "Sélectionnez un appareil"),
  panne: z.string().trim().min(3, "Décrivez la panne").max(500),
  mode: z.enum(["boutique", "domicile"]),
  date: z.string().min(1, "Choisissez une date"),
  creneau: z.enum(["matin", "apres-midi"]),
  paiement: z.enum(["mtn", "moov", "especes"]),
  message: z.string().trim().max(800).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function Reservation() {
  const { device } = Route.useSearch();
  const [ref, setRef] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      appareil: device ?? "",
      mode: "boutique",
      creneau: "matin",
      paiement: "mtn",
    },
  });

  const onSubmit = (values: FormValues) => {
    const numero = `AT-2026-${Math.floor(100 + Math.random() * 899)}`;
    setRef(numero);
    toast.success(`Réservation enregistrée — dossier ${numero}`, {
      description: `Nous confirmons par WhatsApp au ${values.telephone}.`,
    });
    reset({ ...values, panne: "", message: "" });
  };

  const err = (k: keyof FormValues) =>
    errors[k] ? (
      <p className="mt-1 font-mono text-[10px] uppercase text-destructive">{errors[k]?.message}</p>
    ) : null;

  const field =
    "h-11 w-full rounded-sm border border-border bg-card px-4 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Réservation en ligne</span>
          <h1 className="at-display text-4xl md:text-6xl">Réserver une réparation</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Deux minutes suffisent. Nous confirmons votre créneau par WhatsApp et vous recevez un
            numéro de dossier pour suivre l'intervention.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={handleSubmit(onSubmit)} className="border border-border bg-card p-8">
            <h2 className="at-display mb-8 text-2xl">Votre dossier</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="nom" className="at-eyebrow mb-2 block">Nom complet *</label>
                <input id="nom" className={field} {...register("nom")} />
                {err("nom")}
              </div>
              <div>
                <label htmlFor="telephone" className="at-eyebrow mb-2 block">Téléphone / WhatsApp *</label>
                <input id="telephone" inputMode="tel" className={field} placeholder="+229 01 …" {...register("telephone")} />
                {err("telephone")}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="email" className="at-eyebrow mb-2 block">E-mail (optionnel)</label>
                <input id="email" type="email" className={field} {...register("email")} />
                {err("email")}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="appareil" className="at-eyebrow mb-2 block">Appareil *</label>
                <select id="appareil" className={field} {...register("appareil")}>
                  <option value="">Sélectionner un appareil</option>
                  {DEVICES.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} — {d.category}
                    </option>
                  ))}
                  <option value="autre">Autre appareil (préciser ci-dessous)</option>
                </select>
                {err("appareil")}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="panne" className="at-eyebrow mb-2 block">Panne constatée *</label>
                <textarea
                  id="panne"
                  rows={3}
                  className="w-full rounded-sm border border-border bg-card p-4 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Écran fissuré, tactile partiellement mort en haut à droite…"
                  {...register("panne")}
                />
                {err("panne")}
              </div>

              <div>
                <label htmlFor="mode" className="at-eyebrow mb-2 block">Mode de dépôt *</label>
                <select id="mode" className={field} {...register("mode")}>
                  <option value="boutique">Dépôt en boutique (Abomey-Calavi)</option>
                  <option value="domicile">Enlèvement à domicile</option>
                </select>
              </div>
              <div>
                <label htmlFor="paiement" className="at-eyebrow mb-2 block">Paiement souhaité *</label>
                <select id="paiement" className={field} {...register("paiement")}>
                  <option value="mtn">MTN Mobile Money</option>
                  <option value="moov">Moov Money</option>
                  <option value="especes">Espèces</option>
                </select>
              </div>
              <div>
                <label htmlFor="date" className="at-eyebrow mb-2 block">Date souhaitée *</label>
                <input id="date" type="date" className={field} {...register("date")} />
                {err("date")}
              </div>
              <div>
                <label htmlFor="creneau" className="at-eyebrow mb-2 block">Créneau *</label>
                <select id="creneau" className={field} {...register("creneau")}>
                  <option value="matin">Matin (08:00 — 12:00)</option>
                  <option value="apres-midi">Après-midi (13:00 — 19:00)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="message" className="at-eyebrow mb-2 block">Précisions (optionnel)</label>
                <textarea
                  id="message"
                  rows={3}
                  className="w-full rounded-sm border border-border bg-card p-4 text-sm focus:border-primary focus:outline-none"
                  {...register("message")}
                />
              </div>
            </div>

            <Button type="submit" variant="primaryBlock" size="lg" className="mt-8 w-full" disabled={isSubmitting}>
              Confirmer la réservation
            </Button>

            {ref && (
              <div className="mt-6 border border-success/40 bg-success/10 p-4">
                <p className="text-sm font-bold">Dossier {ref} créé.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Conservez ce numéro et suivez l'avancement sur la page{" "}
                  <Link to="/suivi" className="text-primary underline">Suivi</Link>.
                </p>
              </div>
            )}
          </form>

          <aside className="space-y-8">
            <div className="border border-border bg-surface p-8">
              <h2 className="at-eyebrow mb-4">Enlèvement à domicile</h2>
              <p className="text-sm text-muted-foreground">
                Gratuit dès {formatFcfa(50000)} de réparation à Abomey-Calavi, Cotonou et Godomey.
                Sinon {formatFcfa(2000)} de frais de déplacement.
              </p>
            </div>
            <div className="border border-border bg-surface p-8">
              <h2 className="at-eyebrow mb-4">Familles prises en charge</h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {CATEGORIES.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
              <p className="mt-4 font-mono text-[10px] uppercase text-muted-foreground">
                {BRANDS.length} marques référencées
              </p>
            </div>
            <MobileMoneyBar />
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow="Après la réservation" title="Ce qui se passe ensuite" />
          <ProcessSteps />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
