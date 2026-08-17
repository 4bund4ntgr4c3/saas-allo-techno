// ============================================================================
// Allô Techno — Registre des Objets & Accessoires Oubliés (Lost & Found)
// Traçabilité des chargeurs, clés USB et périphériques oubliés en atelier.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface LostItem {
  id: string;
  itemDescription: string;
  category: "chargeur_secteur" | "cle_usb" | "souris_clavier" | "sacoche_housse" | "adaptateur";
  locationFound: "Comptoir Accueil" | "Atelier Diagnostic" | "Navette Coursier";
  foundDate: string;
  linkedTicketRef?: string;
  ownerName?: string;
  ownerPhone?: string;
  status: "a_restituer" | "notifie" | "restitue";
}

export const MOCK_LOST_ITEMS: LostItem[] = [
  {
    id: "lost-01",
    itemDescription: "Chargeur Apple USB-C 67W blanc avec câble MagSafe 3 tressé",
    category: "chargeur_secteur",
    locationFound: "Atelier Diagnostic",
    foundDate: "15 Août 2026",
    linkedTicketRef: "SAV-8492",
    ownerName: "Marc Akowanou",
    ownerPhone: "+229 97 00 11 22",
    status: "notifie",
  },
  {
    id: "lost-02",
    itemDescription: "Clé USB SanDisk Ultra Dual Drive 64 Go rouge",
    category: "cle_usb",
    locationFound: "Comptoir Accueil",
    foundDate: "16 Août 2026",
    status: "a_restituer",
  },
  {
    id: "lost-03",
    itemDescription: "Adaptateur USB-C vers HDMI / VGA Dell DA300",
    category: "adaptateur",
    locationFound: "Navette Coursier",
    foundDate: "13 Août 2026",
    linkedTicketRef: "SAV-8120",
    ownerName: "Sonia Gbaguidi",
    ownerPhone: "+229 95 33 44 55",
    status: "restitue",
  },
];

export const getLostItemsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    items: LostItem[];
    pendingCount: number;
  }> => {
    return {
      items: MOCK_LOST_ITEMS,
      pendingCount: MOCK_LOST_ITEMS.filter((i) => i.status !== "restitue").length,
    };
  },
);

export const notifyOwnerLostItemFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      itemId: z.string().min(1),
    }),
  )
  .handler(async ({ data: input }): Promise<{ success: boolean; message: string }> => {
    return {
      success: true,
      message: `Notification SMS transmise au propriétaire pour l'objet ${input.itemId}.`,
    };
  });
