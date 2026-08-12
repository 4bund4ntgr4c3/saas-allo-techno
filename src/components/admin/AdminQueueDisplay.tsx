import { useState, useEffect } from "react";
import { Clock, Ticket, Users, CheckCircle2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QueueTicket = {
  id: string;
  ticketNumber: string; // e.g. "T-102"
  clientName: string;
  serviceType: string; // "Dépôt Réparation" | "Retrait Appareil" | "Conseil / Achat"
  status: "waiting" | "called" | "in_service" | "completed";
  counterNumber?: number; // Counter 1, 2, 3
  createdAt: string;
};

export function AdminQueueDisplay() {
  const [tickets, setTickets] = useState<QueueTicket[]>([
    { id: "1", ticketNumber: "A-101", clientName: "Kofi Mensah", serviceType: "Dépôt Réparation", status: "in_service", counterNumber: 1, createdAt: "09:15" },
    { id: "2", ticketNumber: "B-102", clientName: "Amina Soglo", serviceType: "Retrait Appareil", status: "called", counterNumber: 2, createdAt: "09:22" },
    { id: "3", ticketNumber: "A-103", clientName: "Jean-Pierre D.", serviceType: "Dépôt Réparation", status: "waiting", createdAt: "09:30" },
    { id: "4", ticketNumber: "C-104", clientName: "Mireille B.", serviceType: "Conseil / Vente", status: "waiting", createdAt: "09:35" },
  ]);

  const [lastCalled, setLastCalled] = useState<QueueTicket | null>(tickets[1]);

  const callNextTicket = (ticketId: string, counter: number) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status: "called", counterNumber: counter } : t
      )
    );
    const target = tickets.find((t) => t.id === ticketId);
    if (target) {
      setLastCalled({ ...target, status: "called", counterNumber: counter });
    }
  };

  return (
    <div className="space-y-8 bg-background p-6 md:p-10 border border-border">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <span className="at-eyebrow text-primary block">Atelier Abomey-Calavi</span>
          <h1 className="at-display text-3xl md:text-5xl">File d'Attente Digitale</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 border border-border bg-surface font-mono text-xs uppercase font-bold flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <span>En Attente: {tickets.filter((t) => t.status === "waiting").length}</span>
          </div>
        </div>
      </div>

      {/* Large TV Display Banner for Last Called Ticket */}
      {lastCalled && (
        <div className="border border-primary bg-primary/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 at-in">
          <div className="flex items-center gap-4">
            <div className="size-14 border border-primary bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-2xl">
              <BellRing className="size-7 animate-bounce" />
            </div>
            <div>
              <span className="at-eyebrow text-primary uppercase block">Ticket Appelé :</span>
              <h2 className="font-mono text-4xl md:text-6xl font-extrabold">{lastCalled.ticketNumber}</h2>
              <p className="text-sm font-medium text-muted-foreground">{lastCalled.clientName} — {lastCalled.serviceType}</p>
            </div>
          </div>
          <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-primary/30 pt-4 md:pt-0 md:pl-8">
            <span className="at-eyebrow text-muted-foreground uppercase block">Se Présenter au</span>
            <span className="at-display text-3xl md:text-5xl text-primary">GUICHET {lastCalled.counterNumber ?? 1}</span>
          </div>
        </div>
      )}

      {/* Ticket List Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Waiting Tickets */}
        <div className="border border-border bg-card p-6 space-y-4">
          <h3 className="at-eyebrow text-foreground text-sm block border-b border-border pb-3">Tickets en Attente</h3>
          <div className="space-y-3">
            {tickets.filter((t) => t.status === "waiting").map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3.5 border border-border bg-surface">
                <div className="flex items-center gap-3">
                  <Ticket className="size-5 text-muted-foreground" />
                  <div>
                    <span className="font-mono text-base font-extrabold block">{t.ticketNumber}</span>
                    <span className="text-xs text-muted-foreground">{t.clientName} ({t.serviceType})</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="technical" onClick={() => callNextTicket(t.id, 1)}>
                    Appeler G1
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => callNextTicket(t.id, 2)}>
                    G2
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Service Tickets */}
        <div className="border border-border bg-card p-6 space-y-4">
          <h3 className="at-eyebrow text-foreground text-sm block border-b border-border pb-3">En Cours de Traitement</h3>
          <div className="space-y-3">
            {tickets.filter((t) => t.status === "called" || t.status === "in_service").map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3.5 border border-primary/40 bg-primary/5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-success" />
                  <div>
                    <span className="font-mono text-base font-extrabold block">{t.ticketNumber}</span>
                    <span className="text-xs text-muted-foreground">{t.clientName} (Guichet {t.counterNumber})</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-1 border border-success bg-success/10 text-success">
                  En guichet
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
