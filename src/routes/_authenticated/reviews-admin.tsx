import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, MailPlus, ShieldAlert, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/site/Blocks";
import { formatDateFr } from "@/lib/reservation-schema";
import { useI18n } from "@/lib/i18n/context";
import {
  adminListReviews,
  adminSetReviewStatus,
  rawReviewsTable,
  sendReviewInvite,
  type AdminReviewRow,
  type ReviewStatus,
} from "@/lib/reviews.functions";

export const Route = createFileRoute("/_authenticated/reviews-admin")({
  head: () => ({
    meta: [
      { title: "Modération des avis clients — Allô Techno" },
      {
        name: "description",
        content: "Invitations à laisser un avis et modération des avis clients.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewsAdminPage,
});

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "En attente",
  published: "Publié",
  hidden: "Masqué",
};

const STATUS_TONE: Record<ReviewStatus, string> = {
  pending: "border-amber-500/50 text-amber-500",
  published: "border-success/50 text-success",
  hidden: "border-border text-muted-foreground",
};

function ReviewsAdminPage() {
  const { user } = Route.useRouteContext();
  const { t, locale } = useI18n();

  const access = useQuery({
    queryKey: ["is-staff", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_staff", { _user_id: user.id });
      if (error) throw error;
      return Boolean(data);
    },
  });

  if (access.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!access.data) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldAlert className="size-10 text-destructive" />
        <h1 className="text-2xl font-semibold">Accès réservé au personnel</h1>
        <p className="text-sm text-muted-foreground">
          Votre compte n'a pas les droits de modération des avis clients.
        </p>
        <Button asChild variant="outline">
          <Link to="/mon-compte">Retour à mon compte</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Espace interne</p>
        </div>
        <h1 className="mt-2 text-3xl font-semibold">Avis clients</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Invitez les clients à noter leur réparation après livraison, puis modérez les avis reçus
          avant publication.
        </p>
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">
              <ArrowLeft className="mr-2 size-4" />
              Administration des dossiers
            </Link>
          </Button>
        </div>
      </header>

      <InvitationsSection />
      <ReviewsSection />
    </div>
  );
}

type ReservationRow = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string;
  device: string;
  slot_date: string;
  status: string;
};

function InvitationsSection() {
  const queryClient = useQueryClient();
  const sendInvite = useServerFn(sendReviewInvite);

  const reservations = useQuery({
    queryKey: ["reviews-admin-reservations"],
    queryFn: async (): Promise<ReservationRow[]> => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, reference, customer_name, phone, device, slot_date, status")
        .in("status", ["livre", "terminee"])
        .order("slot_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const invites = useQuery({
    queryKey: ["review-invites"],
    queryFn: async () => {
      const { data, error } = await rawReviewsTable(supabase)
        .select("reservation_id, sent_at, used_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const send = useMutation({
    mutationFn: async (reservationId: string) => {
      const res = await sendInvite({ data: { reservationId } });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success("Invitation envoyée au client (WhatsApp + e-mail)");
      queryClient.invalidateQueries({ queryKey: ["review-invites"] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Envoi impossible"),
  });

  const inviteByReservation = new Map((invites.data ?? []).map((i) => [i.reservation_id, i]));

  const rows = (reservations.data ?? []).filter(
    (r) => inviteByReservation.get(r.id)?.used_at == null,
  );

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold">Invitations</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Dossiers livrés ou terminés sans avis : envoyez au client le lien sécurisé pour noter sa
        réparation.
      </p>

      {reservations.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement des dossiers…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucun dossier en attente d'invitation.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => {
            const invite = inviteByReservation.get(r.id);
            const sending = send.isPending;
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{r.reference}</p>
                  <p className="font-medium">
                    {r.customer_name} — {r.device}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateFr(r.slot_date, locale)} · {r.phone}
                  </p>
                </div>
                {invite ? (
                  <p className="text-xs text-muted-foreground">
                    {t("reviews.invite.sent")} {new Date(invite.sent_at).toLocaleDateString(locale)}
                  </p>
                ) : (
                  <Button
                    variant="technical"
                    size="sm"
                    disabled={sending}
                    onClick={() => send.mutate(r.id)}
                  >
                    {sending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <MailPlus className="mr-2 size-4" />
                    )}
                    {t("reviews.invite.send")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ReviewsSection() {
  const queryClient = useQueryClient();
  const listReviews = useServerFn(adminListReviews);
  const setStatusFn = useServerFn(adminSetReviewStatus);

  const reviews = useQuery({
    queryKey: ["admin-reviews-list"],
    queryFn: () => listReviews({ data: {} }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReviewStatus }) => {
      await setStatusFn({ data: { id, status } });
    },
    onSuccess: (_d, vars) => {
      toast.success(`Avis ${STATUS_LABEL[vars.status].toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["admin-reviews-list"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible"),
  });

  return (
    <section>
      <h2 className="text-xl font-semibold">Avis</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Les avis soumis par les clients arrivent « en attente » : approuvez-les pour les publier sur
        la page Avis clients.
      </p>

      {reviews.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement des avis…</p>
      ) : (reviews.data ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucun avis pour le moment.</p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left">Note</th>
                <th className="px-4 py-2 text-left">Client</th>
                <th className="px-4 py-2 text-left">Appareil / dossier</th>
                <th className="px-4 py-2 text-left">Avis</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Statut</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(reviews.data ?? []).map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  busy={setStatus.isPending}
                  onStatus={setStatus.mutate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ReviewRow({
  review,
  busy,
  onStatus,
}: {
  review: AdminReviewRow;
  busy: boolean;
  onStatus: (v: { id: string; status: ReviewStatus }) => void;
}) {
  return (
    <tr className="border-b border-border align-top last:border-b-0 hover:bg-surface">
      <td className="px-4 py-3">
        <Stars n={review.rating} />
      </td>
      <td className="px-4 py-3">
        <p className="font-medium">{review.customer_name}</p>
        <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">
          {review.phone}
          {review.verified ? " · vérifié" : ""}
        </p>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {review.device ? <p>{review.device}</p> : null}
        {review.reference ? (
          <p className="font-mono text-[10px] uppercase">{review.reference}</p>
        ) : null}
      </td>
      <td className="max-w-md px-4 py-3 text-sm text-muted-foreground">« {review.comment} »</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
        {new Date(review.created_at).toLocaleString("fr-FR")}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full border px-3 py-1 text-xs ${STATUS_TONE[review.status] ?? ""}`}
        >
          {STATUS_LABEL[review.status] ?? review.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-wrap justify-end gap-2">
          {review.status !== "published" && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => onStatus({ id: review.id, status: "published" })}
            >
              <Star className="mr-2 size-3.5" />
              Approuver
            </Button>
          )}
          {review.status !== "hidden" && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onStatus({ id: review.id, status: "hidden" })}
            >
              Masquer
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
