// Store du visit tour (zustand) : l'overlay et le launcher partagent l'état.
import { create } from "zustand";

export interface TourStep {
  /** Sélecteur data-tour de l'élément à mettre en évidence. */
  target: string;
  titleKey: string;
  bodyKey: string;
}

interface TourState {
  active: boolean;
  index: number;
  steps: TourStep[];
  start: (steps: TourStep[], index?: number) => void;
  next: () => void;
  back: () => void;
  stop: () => void;
}

export const useTourStore = create<TourState>((set) => ({
  active: false,
  index: 0,
  steps: [],
  start: (steps, index = 0) => set({ active: true, steps, index }),
  next: () => set((s) => ({ index: Math.min(s.index + 1, s.steps.length - 1) })),
  back: () => set((s) => ({ index: Math.max(s.index - 1, 0) })),
  stop: () => set({ active: false, index: 0, steps: [] }),
}));

/** Retourne l'élément ciblé par une étape, s'il existe dans le DOM. */
export function tourTarget(step: TourStep): HTMLElement | null {
  if (!step.target) return null;
  return document.querySelector(`[data-tour="${step.target}"]`);
}
