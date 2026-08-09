export type CatalogService = {
  slug: string;
  icon: string;
  i18nKey: string;
  price: number;
  duration: string;
};

export const SERVICES: CatalogService[] = [
  {
    slug: "nettoyage",
    icon: "spray",
    i18nKey: "nettoyage",
    price: 2000,
    duration: "1 h",
  },
  {
    slug: "transfert-donnees",
    icon: "transfer",
    i18nKey: "transfert",
    price: 1200,
    duration: "30 min",
  },
  {
    slug: "sauvegarde-recuperation",
    icon: "backup",
    i18nKey: "sauvegarde",
    price: 6000,
    duration: "Selon volume",
  },
  {
    slug: "reset-usine",
    icon: "reset",
    i18nKey: "reset",
    price: 1200,
    duration: "30 min",
  },
  {
    slug: "pc-tune-up",
    icon: "cpu",
    i18nKey: "pctuneup",
    price: 3200,
    duration: "1 h 30",
  },
  {
    slug: "antivirus-logiciel",
    icon: "shield",
    i18nKey: "antivirus",
    price: 2800,
    duration: "1 h",
  },
];
