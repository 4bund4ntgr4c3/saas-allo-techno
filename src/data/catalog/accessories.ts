// Accessoires disponibles en boutique. Isolé du gros catalogue pour que le
// CartProvider (monté sur toutes les pages via __root) ne charge pas les
// données d'appareils (~500 Ko) dans le bundle du premier rendu.
export type Accessory = {
  slug: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  /** Champs enrichis optionnels utilisés par la page reconditionnés. */
  grade?: string;
  gb?: string;
  warranty?: string;
};

export const ACCESSORIES: Accessory[] = [
  {
    slug: "coque-silicone-iphone",
    name: "Coque silicone renforcée iPhone",
    category: "Coques",
    price: 2600,
    stock: 42,
  },
  {
    slug: "coque-antichoc-samsung",
    name: "Coque antichoc Galaxy A/S",
    category: "Coques",
    price: 2200,
    stock: 31,
  },
  {
    slug: "verre-trempe-9h",
    name: "Protection écran verre trempé 9H",
    category: "Protections d'écran",
    price: 1400,
    stock: 120,
  },
  {
    slug: "chargeur-20w-usbc",
    name: "Chargeur rapide 20W USB-C",
    category: "Chargeurs",
    price: 3600,
    stock: 55,
  },
  {
    slug: "chargeur-65w-gan",
    name: "Chargeur GaN 65W multi-ports",
    category: "Chargeurs",
    price: 9600,
    stock: 12,
  },
  {
    slug: "cable-usbc-lightning",
    name: "Câble USB-C vers Lightning 1 m",
    category: "Câbles",
    price: 2800,
    stock: 64,
  },
  {
    slug: "cable-usbc-usbc-2m",
    name: "Câble USB-C vers USB-C 2 m tressé",
    category: "Câbles",
    price: 2400,
    stock: 48,
  },
  {
    slug: "batterie-externe-20000",
    name: "Batterie externe 20 000 mAh",
    category: "Batteries",
    price: 8800,
    stock: 18,
  },
  {
    slug: "batterie-iphone-12",
    name: "Batterie de remplacement iPhone 12",
    category: "Batteries",
    price: 7600,
    stock: 9,
  },
  {
    slug: "ecouteurs-tws",
    name: "Écouteurs TWS réduction de bruit",
    category: "Écouteurs",
    price: 7000,
    stock: 26,
  },
  {
    slug: "ecouteurs-filaires",
    name: "Écouteurs filaires USB-C",
    category: "Écouteurs",
    price: 1800,
    stock: 73,
  },
  {
    slug: "support-voiture",
    name: "Support téléphone voiture magnétique",
    category: "Accessoires",
    price: 2000,
    stock: 37,
  },

  // Téléphones reconditionnés — au catalogue boutique, catégorie dédiée.
  {
    slug: "reco-iphone-12-128",
    name: "iPhone 12 128 Go reconditionné",
    category: "Reconditionnés",
    price: 72000,
    stock: 4,
    gb: "128 Go",
    grade: "A",
    warranty: "3 mois",
  },
  {
    slug: "reco-iphone-11-64",
    name: "iPhone 11 64 Go reconditionné",
    category: "Reconditionnés",
    price: 58000,
    stock: 5,
    gb: "64 Go",
    grade: "A",
    warranty: "3 mois",
  },
  {
    slug: "reco-galaxy-a54-5g",
    name: "Samsung Galaxy A54 5G reconditionné",
    category: "Reconditionnés",
    price: 62000,
    stock: 6,
    gb: "128 Go",
    grade: "A",
    warranty: "3 mois",
  },
  {
    slug: "reco-galaxy-a34",
    name: "Samsung Galaxy A34 reconditionné",
    category: "Reconditionnés",
    price: 48000,
    stock: 7,
    gb: "128 Go",
    grade: "A+",
    warranty: "6 mois",
  },
  {
    slug: "reco-redmi-note-12",
    name: "Redmi Note 12 reconditionné",
    category: "Reconditionnés",
    price: 38000,
    stock: 8,
    gb: "128 Go",
    grade: "A",
    warranty: "3 mois",
  },
  {
    slug: "reco-tecno-camon-20",
    name: "Tecno Camon 20 reconditionné",
    category: "Reconditionnés",
    price: 32800,
    stock: 6,
    gb: "128 Go",
    grade: "A",
    warranty: "3 mois",
  },
  {
    slug: "reco-infinix-hot-40",
    name: "Infinix Hot 40 reconditionné",
    category: "Reconditionnés",
    price: 28000,
    stock: 9,
    gb: "128 Go",
    grade: "B",
    warranty: "3 mois",
  },
  {
    slug: "reco-iphone-se-2022",
    name: "iPhone SE 2022 reconditionné",
    category: "Reconditionnés",
    price: 52000,
    stock: 4,
    gb: "64 Go",
    grade: "A",
    warranty: "3 mois",
  },
];

export const ACCESSORY_CATEGORIES = [
  "Coques",
  "Protections d'écran",
  "Chargeurs",
  "Câbles",
  "Batteries",
  "Écouteurs",
  "Accessoires",
  "Reconditionnés",
];
