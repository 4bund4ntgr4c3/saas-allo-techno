import { CalendarClock, Clock } from "lucide-react";
import {
  HOURS_BY_PERIOD,
  PERIOD_LABEL,
  type AvailabilityRow,
  type SlotPeriod,
} from "@/lib/reservation-schema";

type Props = {
  date: string;
  creneau: SlotPeriod;
  heure: string | undefined;
  openDates: Map<string, AvailabilityRow[]>;
  isHourTaken: (date: string | null | undefined, hour: string) => boolean;
  isLoading: boolean;
  onSelectDate: (date: string) => void;
  onSelectHour: (hour: string) => void;
};

/**
 * Sélecteur de créneau (type uBreakiFix) : bandeau de jours disponibles puis
 * grille d'heures par demi-journée. Seules les heures réellement libres sont
 * cliquables.
 */
export function SlotPicker({
  date,
  heure,
  openDates,
  isHourTaken,
  isLoading,
  onSelectDate,
  onSelectHour,
}: Props) {
  const dateKeys = [...openDates.keys()].sort();
  const daySlots = openDates.get(date) ?? [];

  return (
    <div>
      <span id="slot-day-label" className="at-eyebrow mb-3 block">
        Choisissez un jour
      </span>
      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Chargement des disponibilités…
        </p>
      ) : dateKeys.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          Aucun créneau libre sur les 10 prochains jours — appelez-nous directement.
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-labelledby="slot-day-label"
          className="flex flex-nowrap gap-2 overflow-x-auto pb-1"
        >
          {dateKeys.map((d) => {
            const on = date === d;
            const dt = new Date(`${d}T12:00:00`);
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onSelectDate(d)}
                className={`w-[76px] shrink-0 border p-3 text-center transition-colors ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground"
                }`}
              >
                <span className="block font-mono text-[10px] uppercase">
                  {dt.toLocaleDateString("fr-FR", { weekday: "short" })}
                </span>
                <span className="block text-lg font-bold leading-tight">{dt.getDate()}</span>
                <span className="block font-mono text-[10px] uppercase">
                  {dt.toLocaleDateString("fr-FR", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {(["matin", "apres-midi"] as SlotPeriod[]).map((period) => {
          const slot = daySlots.find((s) => s.period === period);
          const disabled = !date || !slot;
          return (
            <div key={period} className={`transition-opacity ${disabled ? "opacity-50" : ""}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" strokeWidth={1.5} />
                  <span className="at-eyebrow">{PERIOD_LABEL[period]}</span>
                </span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">
                  {!date
                    ? "Choisissez d'abord un jour"
                    : slot
                      ? `${slot.remaining} place${slot.remaining > 1 ? "s" : ""} restante${slot.remaining > 1 ? "s" : ""}`
                      : "Complet"}
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label={PERIOD_LABEL[period]}
                className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6"
              >
                {HOURS_BY_PERIOD[period].map((h) => {
                  const taken = isHourTaken(date, h);
                  const on = heure === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={disabled || taken}
                      title={taken ? "Déjà réservé" : undefined}
                      onClick={() => onSelectHour(h)}
                      className={`border px-3 py-2.5 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        taken
                          ? "border-border/50 line-through"
                          : on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-foreground"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        aria-live="polite"
        className="mt-8 flex flex-wrap items-center gap-3 border border-border bg-surface p-4"
      >
        <CalendarClock className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Créneau sélectionné
          </p>
          <p className="text-sm font-bold">
            {date && heure
              ? `${new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })} à ${heure}`
              : "Aucun créneau sélectionné"}
          </p>
        </div>
      </div>
    </div>
  );
}
