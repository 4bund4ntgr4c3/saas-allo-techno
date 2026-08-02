import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  HOURS_BY_PERIOD,
  toIsoDate,
  type AvailabilityRow,
  type SlotPeriod,
} from "@/lib/reservation-schema";

export type BookedHour = { slot_date: string; slot_hour: string };

/**
 * Disponibilités en temps réel : capacité par demi-journée + heures déjà réservées.
 * Un canal Realtime sur `reservations` invalide les données dès qu'une réservation
 * est créée, annulée ou déplacée par quelqu'un d'autre.
 */
export function useSlotAvailability(daysAhead = 21) {
  const queryClient = useQueryClient();

  const range = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + daysAhead);
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }, [daysAhead]);

  const availability = useQuery({
    queryKey: ["availability", range.from, range.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("slot_availability", {
        _from: range.from,
        _to: range.to,
      });
      if (error) throw error;
      return (data ?? []) as AvailabilityRow[];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const booked = useQuery({
    queryKey: ["booked-hours", range.from, range.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("booked_hours", {
        _from: range.from,
        _to: range.to,
      });
      if (error) throw error;
      return (data ?? []) as BookedHour[];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel("slot-availability")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["availability"] });
        queryClient.invalidateQueries({ queryKey: ["booked-hours"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  /** Dates ouvertes → périodes encore disponibles. */
  const openDates = useMemo(() => {
    const map = new Map<string, AvailabilityRow[]>();
    for (const row of availability.data ?? []) {
      if (row.remaining <= 0) continue;
      map.set(row.slot_date, [...(map.get(row.slot_date) ?? []), row]);
    }
    return map;
  }, [availability.data]);

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
    void availability.refetch();
    void booked.refetch();
  };

  return {
    range,
    isLoading: availability.isLoading || booked.isLoading,
    openDates,
    takenHours,
    isHourTaken,
    freeHours,
    refresh,
  };
}
