import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarClock, FileDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ReschedulePanel } from "@/components/site/ReschedulePanel";
import { absoluteUrl } from "@/data/catalog";
import { downloadInvoicePdf } from "@/lib/invoice";
import {
  PERIOD_LABEL,
  STATUS_LABEL,
  formatDateFr,
  type DepositMode,
  type SlotPeriod,
} from "@/lib/reservation-schema";

export const Route = createFileRoute("/_authenticated/mon-compte")({
  head: () => ({
    meta: [
      { title: "Mon compte — réservations Allô Techno" },
      {
        name: "description",
        content:
          "Tableau de bord client Allô Techno : suivez l'état de vos réparations, vos créneaux et annulez un rendez-vous.",
      },
      { property: "og:title", content: "Mon compte — Allô Techno" },
      {
        property: "og:description",
        content: "Suivez vos réservations de réparation en temps réel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/mon-compte") }],
  }),
  component: Dashboard,
});

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-4 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const STATUS_TONE: Record<string, string> = {
  en_attente: "border-border text-muted-foreground",
  confirmee: "border-primary/50 text-primary",
  pieces: "border-amber-500/50 text-amber-500",
  en_cours: "border-primary/50 text-primary",
  pret: "border-success/50 text-success",
  livre: "border-success/50 text-success",
  terminee: "border-success/50 text-success",
  annulee: "border-destructive/50 text-destructive",
};

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = Route.useRouteContext();
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile.data) {
      setNom(profile.data.full_name ?? "");
      setTelephone(profile.data.phone ?? "");
    }
  }, [profile.data]);

  const reservations = useQuery({
    queryKey: ["reservations", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, reference, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, message, created_at",
        )
        .order("slot_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: nom, phone: telephone, email: user.email ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil mis à jour");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    },
    onError: () => toast.error("Mise à jour impossible"),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "annulee" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Réservation annulée");
      queryClient.invalidateQueries({ queryKey: ["reservations", user.id] });
    },
    onError: () => toast.error("Annulation impossible"),
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const rows = reservations.data ?? [];
  const active = rows.filter((r) => r.status !== "annulee" && r.status !== "terminee");

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 sm:px-6">
          <div>
            <span className="at-eyebrow mb-4 block">Espace client</span>
            <h1 className="at-display text-4xl md:text-6xl">Mon compte</h1>
            <p className="mt-4 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="technical" size="sm">
              <Link to="/reservation">Nouvelle réservation</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">Administration</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="at-display mb-2 text-2xl">Mes réservations</h2>
            <p className="mb-8 text-sm text-muted-foreground">
              {active.length} intervention{active.length > 1 ? "s" : ""} en cours · {rows.length} au
              total
            </p>

            {reservations.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}

            {!reservations.isLoading && rows.length === 0 && (
              <div className="border border-border bg-card p-8">
                <p className="text-sm font-bold">Aucune réservation pour le moment.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Réservez un créneau et retrouvez ici l'avancement de votre réparation.
                </p>
                <Button asChild variant="primaryBlock" size="lg" className="mt-6">
                  <Link to="/reservation">Réserver une réparation</Link>
                </Button>
              </div>
            )}

            <ul className="space-y-4">
              {rows.map((r) => (
                <li key={r.id} className="border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs uppercase text-muted-foreground">
                        Dossier {r.reference}
                      </p>
                      <h3 className="mt-1 text-lg font-bold">{r.device}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{r.issue}</p>
                    </div>
                    <span
                      className={`rounded-sm border px-3 py-1 font-mono text-[10px] uppercase ${STATUS_TONE[r.status] ?? "border-border"}`}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        downloadInvoicePdf({
                          reference: r.reference,
                          customer_name: profile.data?.full_name ?? "Client",
                          phone: profile.data?.phone ?? "",
                          email: user.email ?? null,
                          device: r.device,
                          issue: r.issue,
                          mode: r.mode,
                          payment: r.payment,
                          slot_date: r.slot_date,
                          slot_period: r.slot_period as SlotPeriod,
                          slot_hour: r.slot_hour ?? null,
                          status: r.status,
                        })
                      }
                      aria-label={`Reçu PDF du dossier ${r.reference}`}
                    >
                      <FileDown className="size-4" />
                    </Button>
                  </div>

                  <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="at-eyebrow mb-1">Date</dt>
                      <dd>{formatDateFr(r.slot_date)}</dd>
                    </div>
                    <div>
                      <dt className="at-eyebrow mb-1">Créneau</dt>
                      <dd>
                        {PERIOD_LABEL[r.slot_period as SlotPeriod]}
                        {r.slot_hour ? ` à ${r.slot_hour}` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="at-eyebrow mb-1">Mode</dt>
                      <dd>
                        {r.mode === "domicile" ? "Enlèvement à domicile" : "Dépôt en boutique"}
                      </dd>
                    </div>
                  </dl>

                  {(r.status === "en_attente" || r.status === "confirmee") && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReschedulingId(reschedulingId === r.id ? null : r.id)}
                      >
                        <CalendarClock className="size-3.5" />
                        {reschedulingId === r.id ? "Masquer" : "Reprogrammer"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancel.isPending}
                        onClick={() => cancel.mutate(r.id)}
                      >
                        Annuler cette réservation
                      </Button>
                    </div>
                  )}

                  {reschedulingId === r.id && (
                    <div className="mt-6">
                      <ReschedulePanel
                        reference={r.reference}
                        mode={(r.mode as DepositMode) ?? "boutique"}
                        current={{ date: r.slot_date, hour: r.slot_hour }}
                        onDone={() => {
                          setReschedulingId(null);
                          queryClient.invalidateQueries({ queryKey: ["reservations", user.id] });
                        }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-8">
            <div className="border border-border bg-surface p-8">
              <h2 className="at-display mb-6 text-xl">Mes informations</h2>
              <div className="space-y-5">
                <div>
                  <label htmlFor="p-nom" className="at-eyebrow mb-2 block">
                    Nom complet
                  </label>
                  <input
                    id="p-nom"
                    className={field}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="p-tel" className="at-eyebrow mb-2 block">
                    Téléphone / WhatsApp
                  </label>
                  <input
                    id="p-tel"
                    inputMode="tel"
                    className={field}
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                  />
                </div>
                <Button
                  variant="primaryBlock"
                  className="w-full"
                  disabled={saveProfile.isPending}
                  onClick={() => saveProfile.mutate()}
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
