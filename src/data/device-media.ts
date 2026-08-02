import { Smartphone, Tablet, Laptop, Monitor, Gamepad2, Watch, type LucideIcon } from "lucide-react";
import smartphoneImg from "@/assets/cat-smartphone.jpg";
import tabletteImg from "@/assets/cat-tablette.jpg";
import portableImg from "@/assets/cat-portable.jpg";
import bureauImg from "@/assets/cat-bureau.jpg";
import consoleImg from "@/assets/cat-console.jpg";
import montreImg from "@/assets/cat-montre.jpg";

/** Icône + photo d'illustration par famille d'appareils. */
export const CATEGORY_MEDIA: Record<string, { icon: LucideIcon; image: string; hint: string }> = {
  Smartphone: { icon: Smartphone, image: smartphoneImg, hint: "iPhone, Galaxy, Tecno, Infinix…" },
  Tablette: { icon: Tablet, image: tabletteImg, hint: "iPad, Galaxy Tab…" },
  "Ordinateur portable": { icon: Laptop, image: portableImg, hint: "MacBook, HP, Lenovo, Dell…" },
  "Ordinateur de bureau": { icon: Monitor, image: bureauImg, hint: "iMac, tout-en-un, tours…" },
  "Console de jeux": { icon: Gamepad2, image: consoleImg, hint: "PS5, Xbox, Switch…" },
  "Montre connectée": { icon: Watch, image: montreImg, hint: "Apple Watch, Galaxy Watch…" },
};

export const categoryMedia = (category: string) => CATEGORY_MEDIA[category];
