import { createFileRoute } from "@tanstack/react-router";
import { COMPANY } from "@/data/catalog";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Éditeur du site, hébergement, propriété intellectuelle, données personnelles et conditions de service d'Allô Techno à Abomey-Calavi.",
      },
      { property: "og:title", content: "Mentions légales — Allô Techno" },
      {
        property: "og:description",
        content: "Informations légales relatives au site et à l'atelier Allô Techno.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  const SECTIONS = [
    {
      t: "Éditeur du site",
      p: [
        `${COMPANY.name}, atelier de réparation d'appareils électroniques.`,
        `Adresse : ${COMPANY.address}.`,
        `Téléphone : ${COMPANY.phone} — E-mail : ${COMPANY.email}.`,
      ],
    },
    {
      t: "Hébergement",
      p: [
        "Le site est hébergé sur une infrastructure cloud gérée. Les données de réservation sont stockées sur une base de données sécurisée avec chiffrement en transit.",
      ],
    },
    {
      t: "Propriété intellectuelle",
      p: [
        "Les textes, visuels, grilles tarifaires et contenus du blog sont la propriété d'Allô Techno. Toute reproduction sans autorisation écrite est interdite.",
        "Les marques citées (Apple, Samsung, Xiaomi, Sony…) appartiennent à leurs détenteurs respectifs. Allô Techno est un réparateur indépendant, non affilié à ces constructeurs.",
      ],
    },
    {
      t: "Données personnelles",
      p: [
        "Les informations collectées lors d'une réservation (nom, téléphone, e-mail, description de la panne) servent exclusivement au traitement du dossier de réparation et au suivi client.",
        "Elles ne sont ni vendues ni cédées à des tiers. Vous pouvez demander leur consultation, leur rectification ou leur suppression en écrivant à " +
          COMPANY.email +
          ".",
        "Un remplacement d'écran ou de batterie n'implique aucun accès au contenu de votre appareil. Pour les interventions carte mère, une sauvegarde préalable est recommandée.",
      ],
    },
    {
      t: "Conditions de service",
      p: [
        "Le diagnostic est gratuit et sans engagement. Aucune intervention n'est réalisée sans validation préalable du devis par le client.",
        "Les appareils non réclamés dans un délai de 90 jours après notification de fin de réparation peuvent faire l'objet de frais de gardiennage.",
        "La garantie s'applique dans les conditions décrites sur la page Garantie et ne couvre ni les dommages accidentels, ni l'oxydation, ni les interventions par un tiers.",
      ],
    },
  ];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <span className="at-eyebrow mb-4 block">Informations légales</span>
        <h1 className="at-display text-4xl md:text-5xl">Mentions légales</h1>
        <div className="mt-12 space-y-12">
          {SECTIONS.map((s) => (
            <div key={s.t} className="border-t border-border pt-8">
              <h2 className="at-display text-xl">{s.t}</h2>
              <div className="mt-4 space-y-3">
                {s.p.map((par) => (
                  <p
                    key={par.slice(0, 30)}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {par}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-12 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>
      </div>
    </section>
  );
}
