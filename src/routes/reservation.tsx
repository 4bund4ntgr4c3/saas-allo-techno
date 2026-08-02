import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CtaBand, MobileMoneyBar, ProcessSteps, SectionHeader } from "@/components/site/Blocks";
import { BRANDS, CATEGORIES, DEVICES, formatFcfa } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { createReservation } from "@/lib/reservations.functions";
import { ReservationSummary } from "@/components/site/ReservationSummary";
import { useSlotAvailability } from "@/hooks/useSlotAvailability";
import {
  HOURS_BY_PERIOD,
  PERIOD_LABEL,
  reservationInputSchema,
  type ReservationInput,
  type SlotPeriod,
} from "@/lib/reservation-schema";

export const Route = createFileRoute("/reservation")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { device?: string; panne?: string; date?: string; creneau?: string; heure?: string } => ({
    ...(typeof search["device"] === "string" ? { device: search["device"] as string } : {}),
    ...(typeof search["panne"] === "string" ? { panne: search["panne"] as string } : {}),
    ...(typeof search["date"] === "string" ? { date: search["date"] as string } : {}),
    ...(typeof search["creneau"] === "string" ? { creneau: search["creneau"] as string } : {}),
    ...(typeof search["heure"] === "string" ? { heure: search["heure"] as string } : {}),
  }),

  head: () => ({
    meta: [
      { title: "Réserver une réparation — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Réservez votre créneau de réparation à Abomey-Calavi : disponibilités en temps réel, dépôt en boutique ou enlèvement à domicile.",
      },
      { property: "og:title", content: "Réserver une réparation — Allô Techno" },
      {
        property: "og:description",
        content: "Choisissez votre appareil, votre panne et un créneau réellement disponible.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/reservation" },
    ],
    links: [{ rel: "canonical", href: "/reservation" }],
  }),
  component: Reservation,
});

const DAYS_AHEAD = 21;

function Reservation() {
  const {
    device,
    panne,
    date: dateParam,
    creneau: creneauParam,
    heure: heureParam,
  } = Route.useSearch();
  const { user } = useSession();
  const submit = useServerFn(createReservation);
  const [ref, setRef] = useState<string | null>(null);
  const [review, setReview] = useState<ReservationInput | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availability = useSlotAvailability(DAYS_AHEAD);
  const { openDates } = availability;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationInputSchema),
    defaultValues: {
      appareil: device ?? "",
      panne: panne ?? "",
      mode: "boutique",
      creneau: (creneauParam === "apres-midi" ? "apres-midi" : "matin") as SlotPeriod,
      heure: heureParam ?? "",
      paiement: "mtn",
      date: dateParam ?? "",
    },
  });

  const selectedDate = watch("date");
  const selectedPeriod = watch("creneau");
  const selectedHour = watch("heure");
  const daySlots = openDates.get(selectedDate) ?? [];

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

  useEffect(() => {
    if (!selectedDate || daySlots.length === 0) return;
    const current = watch("creneau");
    if (!daySlots.some((s) => s.period === current)) {
      setValue("creneau", daySlots[0]!.period);
    }
  }, [selectedDate, daySlots, setValue, watch]);

  // L'heure doit toujours appartenir à la demi-journée choisie.
  useEffect(() => {
    const hours = HOURS_BY_PERIOD[selectedPeriod];
    if (selectedHour && !hours.includes(selectedHour)) setValue("heure", "");
  }, [selectedPeriod, selectedHour, setValue]);

  const onSubmit = (values: ReservationInput) => {
    setReview(values);
    setRef(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmReservation = async () => {
    const values = review;
    if (!values) return;
    setSubmitting(true);
    try {
      const row = await submit({ data: values });
      setRef(row.reference);
      toast.success(`Réservation enregistrée — dossier ${row.reference}`, {
        description: `Confirmation envoyée${values.email ? ` à ${values.email} et` : ""} par WhatsApp au ${values.telephone}.`,
      });
      reset({ ...values, panne: "", message: "", date: "", heure: "" });
      setReview(null);
      availability.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Réservation impossible");
      availability.refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k: keyof ReservationInput) =>
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
            Deux minutes suffisent. Les créneaux affichés sont réellement disponibles : votre place
            est bloquée dès validation et un numéro de dossier vous est attribué.
          </p>
          {!user && (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary underline">
                Connectez-vous
              </Link>{" "}
              pour retrouver toutes vos réservations dans votre espace client.
            </p>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
          {review ? (
            <ReservationSummary
              values={review}
              submitting={submitting}
              onEdit={() => setReview(null)}
              onConfirm={confirmReservation}
            />
          ) : (
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
                <label htmlFor="email" className="at-eyebrow mb-2 block">E-mail (recommandé — confirmation écrite)</label>
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

              <div className="md:col-span-2">
                <label htmlFor="date" className="at-eyebrow mb-2 block">Date disponible *</label>
                <select id="date" className={field} {...register("date")}>
                  <option value="">
                    {availability.isLoading ? "Chargement des disponibilités…" : "Sélectionner une date"}
                  </option>
                  {[...openDates.keys()].sort().map((d) => (
                    <option key={d} value={d}>
                      {new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
                {err("date")}
                {!availability.isLoading && openDates.size === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Aucun créneau libre sur les 3 prochaines semaines — appelez-nous directement.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <span className="at-eyebrow mb-2 block">Créneau *</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["matin", "apres-midi"] as SlotPeriod[]).map((period) => {
                    const slot = daySlots.find((s) => s.period === period);
                    const disabled = !selectedDate || !slot;
                    return (
                      <label
                        key={period}
                        className={`flex cursor-pointer items-start gap-3 border p-4 text-sm ${
                          disabled
                            ? "cursor-not-allowed border-border/50 opacity-50"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        <input
                          type="radio"
                          value={period}
                          disabled={disabled}
                          className="mt-1"
                          {...register("creneau")}
                        />
                        <span>
                          <span className="block font-bold">{PERIOD_LABEL[period]}</span>
                          <span className="font-mono text-[10px] uppercase text-muted-foreground">
                            {!selectedDate
                              ? "Choisissez une date"
                              : slot
                                ? `${slot.remaining} place${slot.remaining > 1 ? "s" : ""} restante${slot.remaining > 1 ? "s" : ""}`
                                : "Complet"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {err("creneau")}
              </div>

              <div className="md:col-span-2">
                <span className="at-eyebrow mb-2 block">Heure du rendez-vous</span>
                <div className="flex flex-wrap gap-2">
                  {HOURS_BY_PERIOD[selectedPeriod].map((h) => {
                    const on = selectedHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        aria-pressed={on}
                        disabled={!selectedDate}
                        onClick={() => setValue("heure", h, { shouldValidate: true })}
                        className={`border px-4 py-2 font-mono text-xs transition-colors disabled:opacity-40 ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-foreground"
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
                {!selectedDate && (
                  <p className="mt-2 font-mono text-[10px] uppercase text-muted-foreground">
                    Choisissez d'abord une date
                  </p>
                )}
                {err("heure")}
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
              Vérifier le récapitulatif
            </Button>

            {ref && (
              <div className="mt-6 border border-success/40 bg-success/10 p-4">
                <p className="text-sm font-bold">Dossier {ref} créé.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Conservez ce numéro. Suivez l'avancement dans votre{" "}
                  <Link to="/mon-compte" className="text-primary underline">espace client</Link> ou sur la page{" "}
                  <Link to="/suivi" className="text-primary underline">Suivi</Link>.
                </p>
              </div>
            )}
          </form>
          )}

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
