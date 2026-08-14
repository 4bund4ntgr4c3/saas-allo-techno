import * as React from "react";
import { Timer } from "lucide-react";

export interface MaintenanceCountdownProps {
  title?: string;
  subtitle?: string;
  targetDays?: number;
}

export function MaintenanceCountdown({
  title = "COMPTE À REBOURS — PROCHAINE ÉCHÉANCE SLA MATÉRIEL",
  subtitle = "Cycle de Maintenance Préventive Trimestrielle",
  targetDays = 4,
}: MaintenanceCountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: targetDays,
    hours: 18,
    minutes: 32,
    seconds: 45,
  });

  React.useEffect(() => {
    const targetDate = new Date(
      Date.now() + (targetDays * 864e5 + 18 * 3600e3 + 32 * 60e3 + 45 * 1000)
    ).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDays]);

  return (
    <div className="border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-lg space-y-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center bg-primary text-primary-foreground font-bold animate-pulse rounded-md">
            <Timer className="size-5" />
          </div>
          <div>
            <span className="at-eyebrow text-[10px] text-primary font-extrabold uppercase tracking-widest block">
              {title}
            </span>
            <h2 className="text-base font-extrabold text-foreground">{subtitle}</h2>
          </div>
        </div>

        {/* Live Timer Boxes */}
        <div className="flex items-center gap-2 font-mono">
          <div className="flex flex-col items-center bg-card border border-border px-3 py-1.5 min-w-16 rounded shadow-xs">
            <span className="text-xl font-black text-primary">{timeLeft.days}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Jours</span>
          </div>
          <span className="text-xl font-bold text-muted-foreground">:</span>
          <div className="flex flex-col items-center bg-card border border-border px-3 py-1.5 min-w-16 rounded shadow-xs">
            <span className="text-xl font-black text-primary">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Heures</span>
          </div>
          <span className="text-xl font-bold text-muted-foreground">:</span>
          <div className="flex flex-col items-center bg-card border border-border px-3 py-1.5 min-w-16 rounded shadow-xs">
            <span className="text-xl font-black text-primary">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Minutes</span>
          </div>
          <span className="text-xl font-bold text-muted-foreground">:</span>
          <div className="flex flex-col items-center bg-card border border-border px-3 py-1.5 min-w-16 rounded shadow-xs">
            <span className="text-xl font-black text-primary">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Secondes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
