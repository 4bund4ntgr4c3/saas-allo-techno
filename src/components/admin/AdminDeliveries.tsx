import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Truck,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Navigation,
  X,
  Search,
} from "lucide-react";
import { setDeliveryStatus } from "@/lib/delivery.functions";
import { field } from "@/components/admin/primitives/AdminField";
import { AdminEmptyState } from "@/components/admin/primitives/AdminEmptyState";
import { formatDateFr } from "@/lib/reservation-schema";
import { useI18n } from "@/lib/i18n/context";

export function AdminDeliveries() {
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [signatureModal, setSignatureModal] = useState<{
    id: string;
    reference: string;
    customer: string;
  } | null>(null);

  const deliveriesQuery = useQuery({
    queryKey: ["admin-deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, reference, customer_name, phone, device, issue, delivery_status, delivery_address, slot_date, slot_period, status",
        )
        .eq("mode", "domicile")
        .order("slot_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateDeliveryMut = useMutation({
    mutationFn: async ({
      id,
      status,
      address,
    }: {
      id: string;
      status: "non_applicable" | "a_planifier" | "en_route" | "livre";
      address?: string;
    }) => {
      await setDeliveryStatus({
        data: {
          reservationId: id,
          status,
          address,
        },
      });
    },
    onSuccess: () => {
      toast.success("Statut de livraison mis à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erreur de mise à jour");
    },
  });

  const deliveries = (deliveriesQuery.data ?? []).filter((d) => {
    const matchStatus = statusFilter === "all" || d.delivery_status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      d.reference.toLowerCase().includes(q) ||
      d.customer_name.toLowerCase().includes(q) ||
      (d.delivery_address && d.delivery_address.toLowerCase().includes(q)) ||
      d.phone.includes(q);
    return matchStatus && matchQuery;
  });

  const openNavigation = (address: string) => {
    const query = encodeURIComponent(`${address}, Bénin`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const openWhatsAppCourier = (phone: string, customer: string, reference: string) => {
    const clean = phone.replace(/[^\d+]/g, "").replace(/^00/, "+");
    const formatted = clean.startsWith("+")
      ? clean.slice(1)
      : clean.startsWith("229")
        ? clean
        : `229${clean}`;
    const text = encodeURIComponent(
      `Bonjour ${customer}, le coursier Allô Techno est en route avec votre appareil (Dossier ${reference}). Merci de préparer la remise.`,
    );
    window.open(`https://wa.me/${formatted}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">Logistique & Tournées</p>
          <h2 className="mt-1 text-xl font-semibold">Gestion des Livraisons & Coursiers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi des enlèvements et livraisons à domicile, navigation GPS et preuve de remise
            client.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par adresse, client, téléphone ou réf..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${field} pl-9 text-xs w-full`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${field} text-xs max-w-44`}
        >
          <option value="all">Tous les statuts</option>
          <option value="a_planifier">À planifier</option>
          <option value="en_route">En route (Coursier)</option>
          <option value="livre">Livré / Réceptionné</option>
        </select>
      </div>

      {/* Delivery Cards */}
      {deliveriesQuery.isLoading ? (
        <p className="text-center py-12 text-xs text-muted-foreground">Chargement des courses...</p>
      ) : deliveries.length === 0 ? (
        <AdminEmptyState
          icon={<Truck className="size-6 text-muted-foreground" />}
          title="Aucune livraison trouvée"
          description="Les demandes d'enlèvement ou de livraison à domicile apparaîtront ici."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveries.map((d) => (
            <div
              key={d.id}
              className={`rounded-xl border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between ${
                d.delivery_status === "en_route"
                  ? "border-primary/60 bg-primary/5"
                  : d.delivery_status === "livre"
                    ? "border-success/40 bg-success/5"
                    : "border-border"
              }`}
            >
              <div className="space-y-3">
                {/* Header card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary">{d.reference}</span>
                    <h3 className="font-bold text-sm text-foreground mt-0.5">{d.customer_name}</h3>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      d.delivery_status === "en_route"
                        ? "bg-primary text-primary-foreground animate-pulse"
                        : d.delivery_status === "livre"
                          ? "bg-success text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {d.delivery_status === "en_route"
                      ? "En route"
                      : d.delivery_status === "livre"
                        ? "Livré"
                        : "À planifier"}
                  </span>
                </div>

                {/* Address & Device */}
                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Truck className="size-3.5 text-primary" />
                    <span>{d.device}</span>
                  </p>
                  <div className="bg-muted/40 p-2 rounded-lg border border-border flex items-start gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      {d.delivery_address || "Adresse non précisée (contact téléphonique requis)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <Clock className="size-3" />
                    <span>Créneau : {formatDateFr(d.slot_date, locale)}</span>
                  </p>
                </div>
              </div>

              {/* Courier Actions */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs p-1 h-8 gap-1"
                    onClick={() => window.open(`tel:${d.phone}`, "_self")}
                  >
                    <Phone className="size-3" />
                    <span>Appel</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs p-1 h-8 gap-1 text-success hover:text-success"
                    onClick={() => openWhatsAppCourier(d.phone, d.customer_name, d.reference)}
                  >
                    <MessageSquare className="size-3" />
                    <span>WhatsApp</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs p-1 h-8 gap-1 text-primary hover:text-primary"
                    disabled={!d.delivery_address}
                    onClick={() => d.delivery_address && openNavigation(d.delivery_address)}
                  >
                    <Navigation className="size-3" />
                    <span>GPS</span>
                  </Button>
                </div>

                {/* Status transitions */}
                <div className="flex items-center gap-2 pt-1">
                  {d.delivery_status === "a_planifier" && (
                    <Button
                      size="sm"
                      className="w-full text-xs font-bold gap-1.5"
                      onClick={() =>
                        updateDeliveryMut.mutate({
                          id: d.id,
                          status: "en_route",
                          address: d.delivery_address ?? "",
                        })
                      }
                    >
                      <Truck className="size-3.5" />
                      <span>Démarrer la course</span>
                    </Button>
                  )}

                  {d.delivery_status === "en_route" && (
                    <Button
                      size="sm"
                      className="w-full text-xs font-bold bg-success text-white hover:bg-success/90 gap-1.5"
                      onClick={() =>
                        setSignatureModal({
                          id: d.id,
                          reference: d.reference,
                          customer: d.customer_name,
                        })
                      }
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Confirmer la remise</span>
                    </Button>
                  )}

                  {d.delivery_status === "livre" && (
                    <div className="w-full flex items-center justify-between text-xs text-success font-medium bg-success/10 py-1.5 px-3 rounded-lg">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5" />
                        <span>Colis remis au client</span>
                      </span>
                      <button
                        onClick={() =>
                          updateDeliveryMut.mutate({ id: d.id, status: "a_planifier" })
                        }
                        className="text-[10px] text-muted-foreground underline"
                      >
                        Modifier
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signature Modal */}
      {signatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-sm rounded-xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h4 className="font-bold text-sm">Preuve de Réception Client</h4>
                <p className="text-xs text-muted-foreground">
                  {signatureModal.customer} • {signatureModal.reference}
                </p>
              </div>
              <button
                onClick={() => setSignatureModal(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Faites signer le client ci-dessous :</p>
              <div className="h-32 bg-white rounded-lg border-2 border-dashed border-black/30 flex items-center justify-center relative">
                <p className="text-black/30 text-xs italic select-none">
                  Zone de signature tactile
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSignatureModal(null)}>
                Annuler
              </Button>
              <Button
                size="sm"
                className="bg-success text-white hover:bg-success/90 gap-1.5 font-bold"
                onClick={() => {
                  updateDeliveryMut.mutate({ id: signatureModal.id, status: "livre" });
                  setSignatureModal(null);
                }}
              >
                <CheckCircle2 className="size-3.5" />
                <span>Valider la remise</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
