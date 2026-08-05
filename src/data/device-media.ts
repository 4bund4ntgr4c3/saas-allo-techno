import {
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Gamepad2,
  Watch,
  Refrigerator,
  Microwave,
  Headphones,
  Tv,
  Hammer,
  type LucideIcon,
} from "lucide-react";

/** Icône SVG par famille d'appareils. */
export const CATEGORY_MEDIA: Record<string, { icon: LucideIcon; hint: string }> = {
  Smartphone: { icon: Smartphone, hint: "iPhone, Galaxy, Tecno, Infinix…" },
  Tablette: { icon: Tablet, hint: "iPad, Galaxy Tab…" },
  "Ordinateur portable": { icon: Laptop, hint: "MacBook, HP, Lenovo, Dell…" },
  "Ordinateur de bureau": { icon: Monitor, hint: "iMac, tout-en-un, tours…" },
  "Console de jeux": { icon: Gamepad2, hint: "PS5, Xbox, Switch…" },
  "Montre connectée": { icon: Watch, hint: "Apple Watch, Galaxy Watch…" },
  Électroménager: { icon: Refrigerator, hint: "Frigo, lave-linge, clim, four…" },
  "Petit électroménager": { icon: Microwave, hint: "Mixeur, fer, cafetière, robot…" },
  "Audio & Hi-Fi": { icon: Headphones, hint: "Casques, enceintes, soundbars…" },
  "TV & Vidéo": { icon: Tv, hint: "TV HD/4K/OLED, projecteurs…" },
  "Outillage & Bricolage": { icon: Hammer, hint: "Perceuses, meuleuses, tondeuses…" },
};

export const categoryMedia = (category: string) => CATEGORY_MEDIA[category];
