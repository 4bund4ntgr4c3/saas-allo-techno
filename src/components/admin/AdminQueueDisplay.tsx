import { useState } from "react";
import { Ticket, Users, CheckCircle2, BellRing, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QueueTicket = {
  id: string;
  ticketNumber: string; // e.g. "T-102"
  clientName: string;
  serviceType: string; // "Dépôt Réparation" | "Retrait Appareil" | "Conseil / Achat"
  status: "waiting" | "called" | "in_service" | "completed";
  counterNumber?: number; // Counter 1, 2, 3, 4
  createdAt: string;
};

export function AdminQueueDisplay() {
  const [activeCounter, setActiveCounter] = useState<number>(1);
  const [tickets, setTickets] = useState<QueueTicket[]>([
    {
      id: "1",
      ticketNumber: "A-101",
      clientName: "Kofi Mensah",
      serviceType: "Dépôt Réparation",
      status: "in_service",
      counterNumber: 1,
      createdAt: "09:15",
    },
    {
      id: "2",
      ticketNumber: "B-102",
      clientName: "Amina Soglo",
      serviceType: "Retrait Appareil",
      status: "called",
      counterNumber: 2,
      createdAt: "09:22",
    },
    {
      id: "3",
      ticketNumber: "A-103",
      clientName: "Jean-Pierre D.",
      serviceType: "Dépôt Réparation",
      status: "waiting",
      createdAt: "09:30",
    },
    {
      id: "4",
      ticketNumber: "C-104",
      clientName: "Mireille B.",
      serviceType: "Conseil / Vente",
      status: "waiting",
      createdAt: "09:35",
    },
    {
      id: "5",
      ticketNumber: "A-105",
      clientName: "Gérard Akpakpa",
      serviceType: "Dépôt Réparation",
      status: "waiting",
      createdAt: "09:42",
    },
  ]);

  const [lastCalled, setLastCalled] = useState<QueueTicket | null>({
    id: "2",
    ticketNumber: "B-102",
    clientName: "Amina Soglo",
    serviceType: "Retrait Appareil",
    status: "called",
    counterNumber: 2,
    createdAt: "09:22",
  });

  const callNextTicket = (ticketId: string, counter: number) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: "called", counterNumber: counter } : t)),
    );
    const target = tickets.find((t) => t.id === ticketId);
    if (target) {
      setLastCalled({ ...target, status: "called", counterNumber: counter });
    }
  };

  const callNextAuto = () => {
    const nextWaiting = tickets.find((t) => t.status === "waiting");
    if (nextWaiting) {
      callNextTicket(nextWaiting.id, activeCounter);
    }
  };

  return (
    <div className="space-y-8 bg-background p-6 md:p-10 border border-border">
      {/* Header Banner & Counter Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-border pb-6">
        <div>
          <span className="at-eyebrow text-primary block">Atelier Abomey-Calavi</span>
          <h1 className="at-display text-3xl md:text-5xl">File d'Attente Digitale</h1>
        </div>

        {/* Counter / Guichet Selector */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 border border-border bg-card p-1.5 rounded-sm">
            <span className="text-xs font-bold uppercase tracking-wider px-2 text-muted-foreground">
              Mon Guichet :
            </span>
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => setActiveCounter(num)}
                className={`px-3 py-1.5 text-xs font-mono font-bold transition-all rounded-xs ${
                  activeCounter === num
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface hover:bg-muted text-muted-foreground"
                }`}
              >
                G{num}
              </button>
            ))}
          </div>

          <Button onClick={callNextAuto} variant="technical" className="gap-2">
            <MonitorPlay className="size-4" />
            <span>Appeler Prochain (G{activeCounter})</span>
          </Button>

          <div className="px-4 py-2 border border-border bg-surface font-mono text-xs uppercase font-bold flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <span>En Attente: {tickets.filter((t) => t.status === "waiting").length}</span>
          </div>
        </div>
      </div>

      {/* Large TV Display Banner for Last Called Ticket */}
      {lastCalled && (
        <div className="border-2 border-primary bg-primary/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 at-in">
          <div className="flex items-center gap-4">
            <div className="size-16 border-2 border-primary bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-3xl shadow-lg">
              <BellRing className="size-8 animate-bounce" />
            </div>
            <div>
              <span className="at-eyebrow text-primary uppercase block font-bold">
                Ticket Appelé :
              </span>
              <h2 className="font-mono text-4xl md:text-6xl font-extrabold tracking-tight">
                {lastCalled.ticketNumber}
              </h2>
              <p className="text-base font-medium text-foreground">
                {lastCalled.clientName} —{" "}
                <span className="text-muted-foreground">{lastCalled.serviceType}</span>
              </p>
            </div>
          </div>
          <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-primary/30 pt-4 md:pt-0 md:pl-8">
            <span className="at-eyebrow text-muted-foreground uppercase block font-bold">
              Se Présenter au
            </span>
            <span className="at-display text-4xl md:text-6xl text-primary">
              GUICHET {lastCalled.counterNumber ?? activeCounter}
            </span>
          </div>
        </div>
      )}

      {/* Ticket List Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Waiting Tickets */}
        <div className="border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="at-eyebrow text-foreground text-sm block">Tickets en Attente</h3>
            <span className="font-mono text-xs text-muted-foreground font-bold">
              {tickets.filter((t) => t.status === "waiting").length} ticket(s)
            </span>
          </div>
          <div className="space-y-3">
            {tickets
              .filter((t) => t.status === "waiting")
              .map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border bg-surface gap-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Ticket className="size-5 text-primary shrink-0" />
                    <div>
                      <span className="font-mono text-lg font-extrabold block">
                        {t.ticketNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.clientName} ({t.serviceType})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((cNum) => (
                      <Button
                        key={cNum}
                        size="sm"
                        variant={cNum === activeCounter ? "technical" : "outline"}
                        className="text-[11px] px-2 py-1 h-7 font-mono"
                        onClick={() => callNextTicket(t.id, cNum)}
                      >
                        G{cNum}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* In Service Tickets */}
        <div className="border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="at-eyebrow text-foreground text-sm block">En Cours de Traitement</h3>
            <span className="font-mono text-xs text-success font-bold">
              {tickets.filter((t) => t.status === "called" || t.status === "in_service").length}{" "}
              actif(s)
            </span>
          </div>
          <div className="space-y-3">
            {tickets
              .filter((t) => t.status === "called" || t.status === "in_service")
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 border border-primary/40 bg-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-success shrink-0" />
                    <div>
                      <span className="font-mono text-lg font-extrabold block">
                        {t.ticketNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.clientName} ·{" "}
                        <strong className="text-primary">Guichet {t.counterNumber}</strong>
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-1 border border-success bg-success/10 text-success">
                    En guichet {t.counterNumber}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
