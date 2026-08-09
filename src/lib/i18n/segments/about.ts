import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  "about.meta.title": "À propos — Allô Techno Bénin",
  "about.meta.description":
    "Découvrez Allô Techno : notre histoire, nos valeurs, notre équipe et notre engagement envers la réparation d'appareils électroniques au Bénin.",
  "about.meta.og.title": "À propos — Allô Techno",
  "about.meta.og.description":
    "Expertise technique certifiée à Abomey-Calavi. Notre histoire et nos valeurs.",
  "about.eyebrow": "Qui sommes-nous",
  "about.title": "L'expertise technique au cœur du Bénin",
  "about.hero":
    "Fondée à Abomey-Calavi, Allô Techno est née de la conviction que chaque appareil mérite une seconde vie. Notre équipe de techniciens certifiés accompagne particuliers et entreprises dans l'entretien et la réparation de leurs appareils.",
  "about.mission.eyebrow": "Notre mission",
  "about.mission.title": "Redonner vie à vos appareils",
  "about.mission.text":
    "Dans un monde où l'obsolescence programmée est la norme, nous choisissons la réparation. Chaque écran remplacé, chaque batterie changée, c'est un appareil de plus qui ne finit pas à la décharge. Notre objectif : rendre la réparation accessible, fiable et abordable pour tous les Béninois.",
  "about.values.expertise": "Expertise certifiée",
  "about.values.expertise.text":
    "Nos techniciens suivent des formations continues sur les dernières technologies. Chaque réparation est effectuée avec des pièces de qualité.",
  "about.values.confiance": "Transparence totale",
  "about.values.confiance.text":
    "Diagnostic gratuit, devis écrit avant toute intervention. Vous savez toujours ce qui est fait sur votre appareil.",
  "about.values.proximite": "Proximité client",
  "about.values.proximite.text":
    "Un service client réactif, un suivi en temps réel et des ateliers situés au plus près de vos quartiers.",
  "about.values.excellence": "Excellence opérationnelle",
  "about.values.excellence.text":
    "Des processus standardisés, un contrôle qualité rigoureux et une garantie sur chaque intervention.",
  "about.timeline.eyebrow": "Notre parcours",
  "about.timeline.fondation": "Création d'Allô Techno",
  "about.timeline.fondation.text":
    "Lancement de l'activité de réparation smartphone depuis un petit atelier à Abomey-Calavi.",
  "about.timeline.atelier": "Premier atelier équipé",
  "about.timeline.atelier.text":
    "Ouverture de notre atelier principal avec salle de soudure BGA et équipements professionnels.",
  "about.timeline.expansion": "Expansion multi-appareils",
  "about.timeline.expansion.text":
    "Extension aux tablettes, ordinateurs, MacBook, consoles de jeux et montres connectées.",
  "about.timeline.aujourd": "Allô Techno aujourd'hui",
  "about.timeline.aujourd.text":
    "Plusieurs milliers de réparations réalisées, une équipe de techniciens certifiés et un service client primé.",
  "about.chiffres.eyebrow": "En chiffres",
  "about.chiffres.title": "Des résultats qui parlent",
  "about.chiffres.reparations.value": "5 000+",
  "about.chiffres.reparations.label": "Réparations effectuées",
  "about.chiffres.clients.value": "3 500+",
  "about.chiffres.clients.label": "Clients satisfaits",
  "about.chiffres.satisfaction.value": "4.8/5",
  "about.chiffres.satisfaction.label": "Note de satisfaction",
  "about.chiffres.garantie.value": "6 mois",
  "about.chiffres.garantie.label": "Garantie sur les pièces",
  "about.localisation": "Où nous trouver",
  "about.localisation.text":
    "Notre atelier principal est situé à Abomey-Calavi, accessible depuis Cotonou en 20 minutes. Nous avons également des points relais dans plusieurs quartiers.",
  "about.localisation.cta": "Nous contacter",
  "about.localisation.stores": "Voir les magasins",
  "about.extra.equipe": "Une équipe passionnée",
  "about.extra.equipe.text":
    "Des techniciens qui aiment leur métier et qui se forment en continu pour restà la pointe.",
  "about.extra.certifications": "Certifications",
  "about.extra.certifications.text":
    "Partenaires agréés des principales marques : Samsung, Apple, Xiaomi, Tecno.",
  "about.extra.engagements": "Nos engagements",
  "about.extra.engagements.text":
    "Écoresponsabilité : nous recyclons 95% des composants usagés et privilégions la réparation au remplacement.",
};

const en = {
  "about.meta.title": "About — Allô Techno Benin",
  "about.meta.description":
    "Discover Allô Techno: our story, values, team and commitment to electronic device repair in Benin.",
  "about.meta.og.title": "About — Allô Techno",
  "about.meta.og.description":
    "Certified technical expertise in Abomey-Calavi. Our story and values.",
  "about.eyebrow": "Who we are",
  "about.title": "Technical expertise at the heart of Benin",
  "about.hero":
    "Founded in Abomey-Calavi, Allô Techno was born from the conviction that every device deserves a second life. Our team of certified technicians supports individuals and businesses in maintaining and repairing their devices.",
  "about.mission.eyebrow": "Our mission",
  "about.mission.title": "Bringing your devices back to life",
  "about.mission.text":
    "In a world where planned obsolescence is the norm, we choose repair. Every screen replaced, every battery changed, is one more device that doesn't end up in landfill. Our goal: make repair accessible, reliable and affordable for all Beninese.",
  "about.values.expertise": "Certified expertise",
  "about.values.expertise.text":
    "Our technicians follow continuous training on the latest technologies. Every repair is done with quality parts.",
  "about.values.confiance": "Full transparency",
  "about.values.confiance.text":
    "Free diagnostic, written quote before any intervention. You always know what's done to your device.",
  "about.values.proximite": "Customer proximity",
  "about.values.proximite.text":
    "Reactive customer service, real-time tracking and workshops located near your neighborhoods.",
  "about.values.excellence": "Operational excellence",
  "about.values.excellence.text":
    "Standardized processes, rigorous quality control and warranty on every intervention.",
  "about.timeline.eyebrow": "Our journey",
  "about.timeline.fondation": "Allô Techno founded",
  "about.timeline.fondation.text":
    "Launch of smartphone repair activity from a small workshop in Abomey-Calavi.",
  "about.timeline.atelier": "First equipped workshop",
  "about.timeline.atelier.text":
    "Opening of our main workshop with BGA soldering room and professional equipment.",
  "about.timeline.expansion": "Multi-device expansion",
  "about.timeline.expansion.text":
    "Extension to tablets, computers, MacBook, gaming consoles and smartwatches.",
  "about.timeline.aujourd": "Allô Techno today",
  "about.timeline.aujourd.text":
    "Thousands of repairs completed, a team of certified technicians and award-winning customer service.",
  "about.chiffres.eyebrow": "In numbers",
  "about.chiffres.title": "Results that speak",
  "about.chiffres.reparations.value": "5,000+",
  "about.chiffres.reparations.label": "Repairs completed",
  "about.chiffres.clients.value": "3,500+",
  "about.chiffres.clients.label": "Satisfied customers",
  "about.chiffres.satisfaction.value": "4.8/5",
  "about.chiffres.satisfaction.label": "Satisfaction rating",
  "about.chiffres.garantie.value": "6 months",
  "about.chiffres.garantie.label": "Parts warranty",
  "about.localisation": "Where to find us",
  "about.localisation.text":
    "Our main workshop is located in Abomey-Calavi, accessible from Cotonou in 20 minutes. We also have relay points in several neighborhoods.",
  "about.localisation.cta": "Contact us",
  "about.localisation.stores": "View stores",
  "about.extra.equipe": "A passionate team",
  "about.extra.equipe.text":
    "Technicians who love their craft and continuously train to stay at the cutting edge.",
  "about.extra.certifications": "Certifications",
  "about.extra.certifications.text":
    "Authorized partner of major brands: Samsung, Apple, Xiaomi, Tecno.",
  "about.extra.engagements": "Our commitments",
  "about.extra.engagements.text":
    "Eco-responsibility: we recycle 95% of used components and prioritize repair over replacement.",
};

registerSegments({ fr, en });
