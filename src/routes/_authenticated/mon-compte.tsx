import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarClock, Copy, FileDown, Star, Users, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReschedulePanel } from "@/components/site/ReschedulePanel";
import { ReservationPayBlock } from "@/components/site/ReservationPayBlock";
import { downloadInvoicePdf } from "@/lib/invoice";
import { applyReferralCode, ensureReferralCode, getLoyaltySummary } from "@/lib/loyalty.functions";
import { listCustomerReviews, type CustomerReview } from "@/lib/reviews.functions";
import { listCustomerPayments, type CustomerPayment } from "@/lib/payments.functions";
import { useI18n } from "@/lib/i18n/context";
import "@/lib/i18n/segments/mon-compte";
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
      { name: "robots", content: "noindex, nofollow" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md border border-border bg-card p-8 text-center">
        <h2 className="at-display mb-2 text-2xl">Erreur</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {error?.message ?? "Impossible de charger votre espace client."}
        </p>
        <button
          className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => reset()}
        >
          Réessayer
        </button>
      </div>
    </div>
  ),
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

const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-600",
  argent: "text-gray-400",
  or: "text-yellow-500",
};

const REVIEW_STATUS_LABEL: Record<string, { fr: string; en: string }> = {
  pending: { fr: "En attente de validation", en: "Awaiting validation" },
  published: { fr: "Publié", en: "Published" },
  hidden: { fr: "Masqué", en: "Hidden" },
};

const PAYMENT_STATUS_TONE: Record<string, string> = {
  paid: "border-success/50 text-success",
  pending: "border-amber-500/50 text-amber-500",
  failed: "border-destructive/50 text-destructive",
  refunded: "border-primary/50 text-primary",
};

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locale, t } = useI18n();
  const { user } = Route.useRouteContext();
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dossiers");

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email, loyalty_points, referral_code, referred_by")
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
          "id, reference, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, message, created_at, quote_amount, quote_status, payment_status",
        )
        .order("slot_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const loyaltyQuery = useQuery({
    queryKey: ["loyalty", user.id],
    queryFn: async () => {
      const result = await getLoyaltySummaryFn();
      return result;
    },
  });

  const reviewsQuery = useQuery({
    queryKey: ["customer-reviews", user.id],
    queryFn: async () => {
      const result = await getCustomerReviewsFn();
      return result;
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["customer-payments", user.id],
    queryFn: async () => {
      const result = await getCustomerPaymentsFn();
      return result;
    },
  });

  const getLoyaltySummaryFn = useServerFn(getLoyaltySummary);

  const getCustomerReviewsFn = useServerFn(listCustomerReviews);
  const getCustomerPaymentsFn = useServerFn(listCustomerPayments);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: nom, phone: telephone, email: user.email ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("mc.profile.saved"));
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    },
    onError: () => toast.error("Mise à jour impossible"),
  });

  const ensureCodeFn = useServerFn(ensureReferralCode);
  const applyCodeFn = useServerFn(applyReferralCode);

  const [referralInput, setReferralInput] = useState("");

  const generateCode = useMutation({
    mutationFn: () => ensureCodeFn(),
    onSuccess: () => {
      toast.success("Code de parrainage généré");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      queryClient.invalidateQueries({ queryKey: ["loyalty", user.id] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Génération impossible";
      toast.error(message);
    },
  });

  const applyCode = useMutation({
    mutationFn: () => applyCodeFn({ data: { code: referralInput } }),
    onSuccess: (res) => {
      toast.success(t("mc.referral.apply.success", [res.points]));
      setReferralInput("");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      queryClient.invalidateQueries({ queryKey: ["loyalty", user.id] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Code de parrainage invalide.";
      toast.error(message);
    },
  });

  const copyReferralLink = async () => {
    const code = profile.data?.referral_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reservation?ref=${code}`);
      toast.success(t("mc.referral.code.copied"));
    } catch {
      toast.error("Copie impossible");
    }
  };

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { data: row, error: fetchError } = await supabase
        .from("reservations")
        .select(
          "reference, customer_name, email, phone, device, issue, mode, payment, slot_date, slot_period, slot_hour, status",
        )
        .eq("id", id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!row) throw new Error("Réservation introuvable");

      const { error } = await supabase
        .from("reservations")
        .update({ status: "annulee" })
        .eq("id", id);
      if (error) throw error;

      try {
        const { notifyReservationStatusChanged } = await import("@/lib/notifications");
        void notifyReservationStatusChanged({
          ...row,
          tracking_code: null,
          status: "annulee",
        });
      } catch (err) {
        console.error("[mon-compte] notification d'annulation échouée", err);
      }
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
  const loyalty = loyaltyQuery.data;
  const reviews = (reviewsQuery.data ?? []) as CustomerReview[];
  const payments = (paymentsQuery.data ?? []) as CustomerPayment[];

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 sm:px-6">
          <div>
            <span className="at-eyebrow mb-4 block">{t("mc.header.eyebrow")}</span>
            <h1 className="at-display text-4xl md:text-6xl">{t("mc.header.title")}</h1>
            <p className="mt-4 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="technical" size="sm">
              <Link to="/$locale/reservation" params={{ locale }}>
                {t("mc.header.new")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">{t("mc.header.admin")}</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              {t("mc.header.logout")}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="dossiers">{t("mc.tab.dossiers")}</TabsTrigger>
              <TabsTrigger value="fidelite">{t("mc.tab.fidelite")}</TabsTrigger>
              <TabsTrigger value="parrainer">{t("mc.tab.parrainer")}</TabsTrigger>
              <TabsTrigger value="avis">{t("mc.tab.avis")}</TabsTrigger>
              <TabsTrigger value="paiements">{t("mc.tab.paiements")}</TabsTrigger>
              <TabsTrigger value="profil">{t("mc.tab.profil")}</TabsTrigger>
            </TabsList>

            {/* ── ONGLET: Mes dossiers ────────────────────────────────── */}
            <TabsContent value="dossiers">
              <h2 className="at-display mb-2 text-2xl">{t("mc.tab.dossiers")}</h2>
              <p className="mb-8 text-sm text-muted-foreground">
                {t("mc.dossiers.active", [active.length, rows.length])}
              </p>

              {reservations.isLoading && (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              )}

              {!reservations.isLoading && rows.length === 0 && (
                <div className="border border-border bg-card p-8">
                  <p className="text-sm font-bold">{t("mc.dossiers.empty.title")}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("mc.dossiers.empty.text")}
                  </p>
                  <Button asChild variant="primaryBlock" size="lg" className="mt-6">
                    <Link to="/$locale/reservation" params={{ locale }}>
                      {t("mc.dossiers.empty.cta")}
                    </Link>
                  </Button>
                </div>
              )}

              <ul className="space-y-4">
                {rows.map((r) => {
                  const payStatus = (r as { payment_status?: string | null }).payment_status;
                  const canPay =
                    (r.quote_amount ?? 0) > 0 &&
                    r.quote_status === "approved" &&
                    payStatus !== "paid";
                  return (
                    <li key={r.id} className="border border-border bg-card p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-xs uppercase text-muted-foreground">
                            {t("mc.dossiers.reference", [r.reference])}
                          </p>
                          <h3 className="mt-1 text-lg font-bold">{r.device}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{r.issue}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-sm border px-3 py-1 font-mono text-[10px] uppercase ${STATUS_TONE[r.status] ?? "border-border"}`}
                          >
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                          {payStatus === "paid" && (
                            <span className="rounded-sm border border-success/50 px-3 py-1 font-mono text-[10px] uppercase text-success">
                              {t("mc.dossiers.paid")}
                            </span>
                          )}
                        </div>
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
                          aria-label={t("mc.dossiers.pdf", [r.reference])}
                        >
                          <FileDown className="size-4" />
                        </Button>
                      </div>

                      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="at-eyebrow mb-1">{t("mc.dossiers.date")}</dt>
                          <dd>{formatDateFr(r.slot_date)}</dd>
                        </div>
                        <div>
                          <dt className="at-eyebrow mb-1">{t("mc.dossiers.slot")}</dt>
                          <dd>
                            {PERIOD_LABEL[r.slot_period as SlotPeriod]}
                            {r.slot_hour ? ` à ${r.slot_hour}` : ""}
                          </dd>
                        </div>
                        <div>
                          <dt className="at-eyebrow mb-1">{t("mc.dossiers.mode")}</dt>
                          <dd>
                            {r.mode === "domicile"
                              ? t("mc.dossiers.mode.domicile")
                              : t("mc.dossiers.mode.boutique")}
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
                            {reschedulingId === r.id
                              ? t("mc.dossiers.reschedule.hide")
                              : t("mc.dossiers.reschedule")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={cancel.isPending}
                            onClick={() => cancel.mutate(r.id)}
                          >
                            {t("mc.dossiers.cancel")}
                          </Button>
                        </div>
                      )}

                      {canPay && (
                        <ReservationPayBlock
                          reference={r.reference}
                          amount={r.quote_amount ?? 0}
                          alreadyPaid={payStatus === "paid"}
                          userId={user.id}
                        />
                      )}

                      {reschedulingId === r.id && (
                        <div className="mt-6">
                          <ReschedulePanel
                            reference={r.reference}
                            mode={(r.mode as DepositMode) ?? "boutique"}
                            current={{ date: r.slot_date, hour: r.slot_hour }}
                            onDone={() => {
                              setReschedulingId(null);
                              queryClient.invalidateQueries({
                                queryKey: ["reservations", user.id],
                              });
                            }}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </TabsContent>

            {/* ── ONGLET: Fidélité ─────────────────────────────────────── */}
            <TabsContent value="fidelite">
              <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
                <div className="border border-border bg-surface p-8">
                  <h2 className="at-display mb-6 text-xl">{t("mc.loyalty.title")}</h2>
                  {loyaltyQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                  ) : loyalty ? (
                    <div className="space-y-6">
                      <div className="flex items-end gap-4">
                        <p className="at-display text-5xl font-bold text-primary">
                          {loyalty.points}
                        </p>
                        <p className="mb-1 text-sm text-muted-foreground">
                          {t("mc.loyalty.points")}
                        </p>
                      </div>

                      <div className="rounded-sm border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy className={`size-5 ${TIER_COLORS[loyalty.tier.tier]}`} />
                            <span className="font-bold">
                              {t(`mc.loyalty.tier.${loyalty.tier.tier}`)}
                            </span>
                          </div>
                          {loyalty.tier.next && (
                            <span className="text-xs text-muted-foreground">
                              {t("mc.loyalty.tier.next")} :{" "}
                              {t(`mc.loyalty.tier.${loyalty.tier.next.tier}`)}
                            </span>
                          )}
                        </div>
                        {loyalty.tier.next && (
                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                              <span>{loyalty.points}</span>
                              <span>{loyalty.tier.next.min}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                  width: `${Math.min(100, (loyalty.points / loyalty.tier.next.min) * 100)}%`,
                                }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("mc.loyalty.tier.progress", [
                                loyalty.points,
                                t(`mc.loyalty.tier.${loyalty.tier.next.tier}`),
                              ])}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="at-eyebrow mb-2">{t("mc.loyalty.tier.advantages")}</p>
                        <p className="text-sm text-muted-foreground">{loyalty.tier.advantages}</p>
                      </div>

                      <p className="text-sm text-muted-foreground">{t("mc.loyalty.hint")}</p>
                    </div>
                  ) : null}
                </div>

                <div className="border border-border bg-surface p-8">
                  <h3 className="at-display mb-4 text-lg">{t("mc.loyalty.history.title")}</h3>
                  {loyaltyQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                  ) : loyalty && loyalty.ledger.length > 0 ? (
                    <ul className="space-y-3">
                      {loyalty.ledger.map(
                        (
                          entry: {
                            created_at: string;
                            reason: string;
                            reference: string | null;
                            delta: number;
                          },
                          i: number,
                        ) => (
                          <li
                            key={`${entry.created_at}-${i}`}
                            className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {t(`mc.loyalty.history.reason.${entry.reason}`) ?? entry.reason}
                                {entry.reference ? ` — ${entry.reference}` : ""}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateFr(entry.created_at)}
                              </p>
                            </div>
                            <span
                              className={`font-mono text-sm font-bold ${entry.delta > 0 ? "text-success" : "text-destructive"}`}
                            >
                              {entry.delta > 0 ? "+" : ""}
                              {entry.delta}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("mc.loyalty.history.empty")}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── ONGLET: Parrainer ────────────────────────────────────── */}
            <TabsContent value="parrainer">
              <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
                <div className="border border-border bg-surface p-8">
                  <h2 className="at-display mb-2 text-xl">{t("mc.referral.title")}</h2>
                  <p className="mb-6 text-sm text-muted-foreground">{t("mc.referral.subtitle")}</p>

                  <div className="space-y-6">
                    {profile.data?.referral_code ? (
                      <div>
                        <p className="at-eyebrow mb-2 block">{t("mc.referral.code.label")}</p>
                        <div className="flex items-center gap-3">
                          <code className="rounded-sm border border-border bg-card px-3 py-2 font-mono text-sm">
                            {profile.data.referral_code}
                          </code>
                          <Button variant="outline" size="sm" onClick={copyReferralLink}>
                            <Copy className="size-3.5" />
                            {t("mc.referral.code.copy")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={generateCode.isPending}
                        onClick={() => generateCode.mutate()}
                      >
                        {t("mc.referral.code.generate")}
                      </Button>
                    )}

                    {loyalty && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-sm border border-border bg-card p-4">
                          <Users className="mb-2 size-4 text-muted-foreground" />
                          <p className="text-2xl font-bold">{loyalty.referral_count}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("mc.referral.stats.invited")}
                          </p>
                        </div>
                        <div className="rounded-sm border border-border bg-card p-4">
                          <Trophy className="mb-2 size-4 text-muted-foreground" />
                          <p className="text-2xl font-bold">+{loyalty.referral_bonus_earned}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("mc.referral.stats.bonus")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-border bg-surface p-8">
                  {profile.data?.referred_by ? (
                    <p className="text-sm text-muted-foreground">{t("mc.referral.already")}</p>
                  ) : (
                    <form
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (referralInput.trim()) applyCode.mutate();
                      }}
                    >
                      <div>
                        <label htmlFor="p-ref" className="at-eyebrow mb-2 block">
                          {t("mc.referral.apply.label")}
                        </label>
                        <input
                          id="p-ref"
                          className={field}
                          placeholder={t("mc.referral.apply.placeholder")}
                          value={referralInput}
                          onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                        />
                      </div>
                      <Button
                        variant="primaryBlock"
                        className="w-full"
                        type="submit"
                        disabled={applyCode.isPending || !referralInput.trim()}
                      >
                        {t("mc.referral.apply.submit")}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── ONGLET: Mes avis ─────────────────────────────────────── */}
            <TabsContent value="avis">
              <h2 className="at-display mb-6 text-2xl">{t("mc.reviews.title")}</h2>
              {reviewsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : reviews.length === 0 ? (
                <div className="border border-border bg-card p-8">
                  <p className="text-sm text-muted-foreground">{t("mc.reviews.empty")}</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((review) => (
                    <li key={review.id} className="border border-border bg-card p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-xs uppercase text-muted-foreground">
                            {review.reference
                              ? t("mc.dossiers.reference", [review.reference])
                              : (review.device ?? "")}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`size-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                              />
                            ))}
                            <span className="text-sm text-muted-foreground">
                              ({review.rating}/5)
                            </span>
                          </div>
                          <p className="mt-2 text-sm">{review.comment}</p>
                        </div>
                        <span
                          className={`rounded-sm border px-3 py-1 font-mono text-[10px] uppercase ${
                            review.status === "published"
                              ? "border-success/50 text-success"
                              : review.status === "hidden"
                                ? "border-destructive/50 text-destructive"
                                : "border-border text-muted-foreground"
                          }`}
                        >
                          {REVIEW_STATUS_LABEL[review.status]?.[locale] ?? review.status}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {formatDateFr(review.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            {/* ── ONGLET: Mes paiements ───────────────────────────────── */}
            <TabsContent value="paiements">
              <h2 className="at-display mb-2 text-2xl">{t("mc.payments.title")}</h2>
              {paymentsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : payments.length === 0 ? (
                <div className="border border-border bg-card p-8">
                  <p className="text-sm text-muted-foreground">{t("mc.payments.empty")}</p>
                </div>
              ) : (
                <>
                  <p className="mb-6 text-sm font-semibold">
                    {t("mc.payments.total", [
                      payments
                        .filter((p) => p.status === "paid")
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString("fr-FR"),
                    ])}
                  </p>
                  <ul className="space-y-4">
                    {payments.map((p) => (
                      <li key={p.id} className="border border-border bg-card p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="font-mono text-xs uppercase text-muted-foreground">
                              {t("mc.dossiers.reference", [p.reference])}
                            </p>
                            {p.device && (
                              <p className="mt-1 text-sm text-muted-foreground">{p.device}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-sm border px-3 py-1 font-mono text-[10px] uppercase ${PAYMENT_STATUS_TONE[p.status] ?? "border-border"}`}
                            >
                              {t(`mc.payments.status.${p.status}`)}
                            </span>
                          </div>
                        </div>
                        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                          <div>
                            <dt className="at-eyebrow mb-1">{t("mc.payments.amount")}</dt>
                            <dd className="font-semibold">
                              {p.amount.toLocaleString("fr-FR")} FCFA
                            </dd>
                          </div>
                          <div>
                            <dt className="at-eyebrow mb-1">{t("mc.payments.method")}</dt>
                            <dd>{p.method}</dd>
                          </div>
                          <div>
                            <dt className="at-eyebrow mb-1">Date</dt>
                            <dd>{formatDateFr(p.created_at)}</dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </TabsContent>

            {/* ── ONGLET: Profil ───────────────────────────────────────── */}
            <TabsContent value="profil">
              <div className="max-w-md">
                <h2 className="at-display mb-6 text-2xl">{t("mc.profile.title")}</h2>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="p-nom" className="at-eyebrow mb-2 block">
                      {t("mc.profile.name")}
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
                      {t("mc.profile.phone")}
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
                    {t("mc.profile.save")}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </>
  );
}
