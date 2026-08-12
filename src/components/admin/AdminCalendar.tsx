import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface CalendarEvent {
  id: string;
  date: string;
  period: string;
  reference: string;
  device: string;
  customerName: string;
  status: string;
}

interface Props {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

const STATUS_COLORS: Record<string, string> = {
  en_attente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmee: "bg-blue-100 text-blue-800 border-blue-300",
  pieces: "bg-orange-100 text-orange-800 border-orange-300",
  en_cours: "bg-purple-100 text-purple-800 border-purple-300",
  pret: "bg-green-100 text-green-800 border-green-300",
  livre: "bg-emerald-100 text-emerald-800 border-emerald-300",
  terminee: "bg-gray-100 text-gray-600 border-gray-300",
  annulee: "bg-red-100 text-red-800 border-red-300",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function AdminCalendar({ events, onEventClick }: Props) {
  const { t } = useI18n();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const DAYS = [
    t("admin.calendar.day.sunday"),
    t("admin.calendar.day.monday"),
    t("admin.calendar.day.tuesday"),
    t("admin.calendar.day.wednesday"),
    t("admin.calendar.day.thursday"),
    t("admin.calendar.day.friday"),
    t("admin.calendar.day.saturday"),
  ];
  const MONTHS = [
    t("admin.calendar.month.january"),
    t("admin.calendar.month.february"),
    t("admin.calendar.month.march"),
    t("admin.calendar.month.april"),
    t("admin.calendar.month.may"),
    t("admin.calendar.month.june"),
    t("admin.calendar.month.july"),
    t("admin.calendar.month.august"),
    t("admin.calendar.month.september"),
    t("admin.calendar.month.october"),
    t("admin.calendar.month.november"),
    t("admin.calendar.month.december"),
  ];
  const PERIOD_LABELS: Record<string, string> = {
    matin: t("admin.calendar.period.morning"),
    apres_midi: t("admin.calendar.period.afternoon"),
  };

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const existing = map.get(event.date) ?? [];
      existing.push(event);
      map.set(event.date, existing);
    }
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeft className="size-4" />
        </Button>
        <h3 className="text-sm font-bold">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border">
        {DAYS.map((day) => (
          <div
            key={day}
            className="bg-surface p-2 text-center text-[10px] font-bold uppercase text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="bg-card p-2 min-h-[80px]" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = formatDate(currentYear, currentMonth, day);
          const dayEvents = eventsByDate.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={day}
              className={`bg-card p-1.5 min-h-[80px] ${isToday ? "ring-2 ring-primary" : ""}`}
            >
              <span
                className={`text-xs font-mono ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}
              >
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={`w-full rounded border px-1 py-0.5 text-left text-[9px] font-medium transition-colors hover:opacity-80 ${STATUS_COLORS[event.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    <span className="block truncate">
                      {PERIOD_LABELS[event.period] ?? event.period}
                    </span>
                    <span className="block truncate text-[8px] opacity-70">{event.reference}</span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="block text-[9px] text-center text-muted-foreground">
                    +{dayEvents.length - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
