import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  HOURS_BY_PERIOD,
  openWindowFor,
  toIsoDate,
  type AvailabilityRow,
  type DepositMode,
  type SlotPeriod,
} from "@/lib/reservation-schema";

export type BookedHour = { slot_date: string; slot_hour: string };

const PERIODS: SlotPeriod[] = ["matin", "apres-midi"];

/**
 * Disponibilités dérivées automatiquement des horaires d'ouverture (OPEN_HOURS) :
 * chaque jour ouvert du calendrier propose ses deux demi-journées, sans dépendre
 * d'une table de capacité. Seules les heures déjà réservées (booked_hours) sont
 * lues côté serveur ; un canal Realtime sur `reservations` les invalide en direct.
 */
export function useSlotAvailability(mode: DepositMode = "boutique", daysAhead = 10) {
  const queryClient = useQueryClient();

  const range = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + daysAhead);
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }, [daysAhead]);

  /** Dates ouvertes pour le mode choisi, selon les horaires (fermé le dimanche). */
  const openDates = useMemo(() => {
    const map = new Map<string, AvailabilityRow[]>();
    const start = new Date(`${range.from}T00:00:00`);
    for (let i = 0; i <= daysAhead; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      if (!openWindowFor(mode, day.getDay())) continue;
      const iso = toIsoDate(day);
      map.set(
        iso,
        PERIODS.map((p) => ({ slot_date: iso, period: p, capacity: 0, remaining: 1 })),
      );
    }
    return map;
  }, [range.from, daysAhead, mode]);

  /** Heures déjà prises, par date (aucune si la requête échoue). */
  const booked = useQuery({
    queryKey: ["booked-hours", mode, range.from, range.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("booked_hours", {
        _from: range.from,
        _to: range.to,
        _mode: mode,
      });
      if (error) return [] as BookedHour[];
      return (data ?? []) as BookedHour[];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel("slot-availability")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["booked-hours"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  /** Heures déjà prises, par date. */
  const takenHours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const row of booked.data ?? []) {
      const set = map.get(row.slot_date) ?? new Set<string>();
      set.add(row.slot_hour);
      map.set(row.slot_date, set);
    }
    return map;
  }, [booked.data]);

  const isHourTaken = (date: string | null | undefined, hour: string) =>
    !!date && (takenHours.get(date)?.has(hour) ?? false);

  /** Heures libres pour une date (toutes périodes ouvertes confondues). */
  const freeHours = (date: string | null | undefined) => {
    if (!date) return [] as string[];
    const periods = (openDates.get(date) ?? []).map((s) => s.period as SlotPeriod);
    return periods.flatMap((p) => HOURS_BY_PERIOD[p]).filter((h) => !isHourTaken(date, h));
  };

  const refresh = () => {
    void booked.refetch();
  };

  return {
    range,
    isLoading: booked.isLoading,
    openDates,
    takenHours,
    isHourTaken,
    freeHours,
    refresh,
  };
}
