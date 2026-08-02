import { Smartphone, Tablet, Laptop, Monitor, Gamepad2, Watch, type LucideIcon } from "lucide-react";

/** Icône SVG par famille d'appareils. */
export const CATEGORY_MEDIA: Record<string, { icon: LucideIcon; hint: string }> = {
  Smartphone: { icon: Smartphone, hint: "iPhone, Galaxy, Tecno, Infinix…" },
  Tablette: { icon: Tablet, hint: "iPad, Galaxy Tab…" },
  "Ordinateur portable": { icon: Laptop, hint: "MacBook, HP, Lenovo, Dell…" },
  "Ordinateur de bureau": { icon: Monitor, hint: "iMac, tout-en-un, tours…" },
  "Console de jeux": { icon: Gamepad2, hint: "PS5, Xbox, Switch…" },
  "Montre connectée": { icon: Watch, hint: "Apple Watch, Galaxy Watch…" },
};

export const categoryMedia = (category: string) => CATEGORY_MEDIA[category];
