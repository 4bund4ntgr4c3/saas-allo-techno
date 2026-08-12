import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  "work-at.meta.title": "Rejoindre l'équipe — Allô Techno Bénin",
  "work-at.meta.description":
    "Rejoignez l'équipe Allô Techno : technicien, commercial, stagiaire, manager. Postes ouverts à Abomey-Calavi.",
  "work-at.meta.og.title": "Rejoindre l'équipe — Allô Techno",
  "work-at.meta.og.description": "Offres d'emploi et stages chez Allô Techno au Bénin.",
  "work-at.eyebrow": "Carrières",
  "work-at.title": "Rejoignez l'aventure Allô Techno",
  "work-at.hero":
    "Nous recherchons des talents passionnés par la technologie et le service client. Rejoignez une équipe dynamique où chaque jour apporte de nouveaux défis techniques.",
  "work-at.why.eyebrow": "Pourquoi nous",
  "work-at.why.title": "Une entreprise qui grandit avec vous",
  "work-at.why.text":
    "Chez Allô Techno, votre développement professionnel est au cœur de notre politique. Nous investissons dans la formation et créons un environnement de travail stimulant.",
  "work-at.perks.stabilite": "Stabilité",
  "work-at.perks.stabilite.text": "CDI et horaires fixes pour un équilibre de vie sain.",
  "work-at.perks.formation": "Formation continue",
  "work-at.perks.formation.text":
    "Sessions de formation mensuelles sur les nouvelles technologies.",
  "work-at.perks.equilibre": "Équilibre vie pro/perso",
  "work-at.perks.equilibre.text": "Horaires flexibles et respect du temps personnel.",
  "work-at.perks.proximite": "Proximité",
  "work-at.perks.proximite.text": "Un management de proximité et une équipe soudée.",
  "work-at.roles.eyebrow": "Postes ouverts",
  "work-at.roles.technicien": "Technicien réparation",
  "work-at.roles.technicien.text":
    "Diagnostic, réparation et contrôle qualité sur smartphones, tablettes, ordinateurs et consoles.",
  "work-at.roles.technicien.type": "CDI",
  "work-at.roles.technicien.location": "Abomey-Calavi",
  "work-at.roles.commercial": "Commercial terrain",
  "work-at.roles.commercial.text":
    "Développement commercial, prospection et gestion de la relation client B2B.",
  "work-at.roles.commercial.type": "CDI",
  "work-at.roles.commercial.location": "Cotonou / Abomey-Calavi",
  "work-at.roles.stagiare": "Stagiaire technique",
  "work-at.roles.stagiare.text":
    "Stage de 3 à 6 mois pour apprendre les techniques de réparation auprès de nos experts.",
  "work-at.roles.stagiare.type": "Stage",
  "work-at.roles.stagiare.location": "Abomey-Calavi",
  "work-at.roles.manager": "Manager d'atelier",
  "work-at.roles.manager.text":
    "Gestion d'équipe, planification des interventions et optimisation des processus.",
  "work-at.roles.manager.type": "CDI",
  "work-at.roles.manager.location": "Abomey-Calavi",
  "work-at.process.eyebrow": "Notre processus",
  "work-at.process.title": "Comment postuler",
  "work-at.process.candidature": "Envoyez votre candidature",
  "work-at.process.candidature.text":
    "Envoyez votre CV et une lettre de motivation à recrutement@allotechno.africa.",
  "work-at.process.entretien": "Entretien technique",
  "work-at.process.entretien.text":
    "Un échange de 30 minutes pour évaluer vos compétences techniques et votre motivation.",
  "work-at.process.essai": "Test pratique",
  "work-at.process.essai.text":
    "Une session pratique en atelier pour valider vos compétences sur le terrain.",
  "work-at.process.embauche": "Bienvenue !",
  "work-at.process.embauche.text":
    "Intégration avec un tuteur dédié et formation aux processus Allô Techno.",
  "work-at.apply.title": "Prêt à nous rejoindre ?",
  "work-at.apply.text":
    "Envoyez-nous votre candidature ou contactez-nous pour en savoir plus sur les postes disponibles.",
  "work-at.apply.cta": "Postuler maintenant",
  "work-at.apply.email": "Ou envoyer un email",
};

const en = {
  "work-at.meta.title": "Work at — Allô Techno Benin",
  "work-at.meta.description":
    "Join the Allô Techno team: technician, sales, intern, manager. Open positions in Abomey-Calavi.",
  "work-at.meta.og.title": "Work at — Allô Techno",
  "work-at.meta.og.description": "Job openings and internships at Allô Techno in Benin.",
  "work-at.eyebrow": "Careers",
  "work-at.title": "Join the Allô Techno adventure",
  "work-at.hero":
    "We're looking for talented people passionate about technology and customer service. Join a dynamic team where every day brings new technical challenges.",
  "work-at.why.eyebrow": "Why us",
  "work-at.why.title": "A company that grows with you",
  "work-at.why.text":
    "At Allô Techno, your professional development is at the heart of our policy. We invest in training and create a stimulating work environment.",
  "work-at.perks.stabilite": "Stability",
  "work-at.perks.stabilite.text":
    "Permanent contracts and fixed hours for a healthy work-life balance.",
  "work-at.perks.formation": "Continuous training",
  "work-at.perks.formation.text": "Monthly training sessions on new technologies.",
  "work-at.perks.equilibre": "Work-life balance",
  "work-at.perks.equilibre.text": "Flexible hours and respect for personal time.",
  "work-at.perks.proximite": "Proximity",
  "work-at.perks.proximite.text": "Close management and a tight-knit team.",
  "work-at.roles.eyebrow": "Open positions",
  "work-at.roles.technicien": "Repair technician",
  "work-at.roles.technicien.text":
    "Diagnosis, repair and quality control on smartphones, tablets, computers and consoles.",
  "work-at.roles.technicien.type": "Full-time",
  "work-at.roles.technicien.location": "Abomey-Calavi",
  "work-at.roles.commercial": "Field sales",
  "work-at.roles.commercial.text":
    "Business development, prospecting and B2B client relationship management.",
  "work-at.roles.commercial.type": "Full-time",
  "work-at.roles.commercial.location": "Cotonou / Abomey-Calavi",
  "work-at.roles.stagiare": "Technical intern",
  "work-at.roles.stagiare.text":
    "3 to 6 month internship to learn repair techniques from our experts.",
  "work-at.roles.stagiare.type": "Internship",
  "work-at.roles.stagiare.location": "Abomey-Calavi",
  "work-at.roles.manager": "Workshop manager",
  "work-at.roles.manager.text": "Team management, intervention planning and process optimization.",
  "work-at.roles.manager.type": "Full-time",
  "work-at.roles.manager.location": "Abomey-Calavi",
  "work-at.process.eyebrow": "Our process",
  "work-at.process.title": "How to apply",
  "work-at.process.candidature": "Send your application",
  "work-at.process.candidature.text":
    "Send your CV and cover letter to recrutement@allotechno.africa.",
  "work-at.process.entretien": "Technical interview",
  "work-at.process.entretien.text":
    "A 30-minute chat to assess your technical skills and motivation.",
  "work-at.process.essai": "Practical test",
  "work-at.process.essai.text": "A hands-on workshop session to validate your skills in the field.",
  "work-at.process.embauche": "Welcome!",
  "work-at.process.embauche.text":
    "Onboarding with a dedicated tutor and training on Allô Techno processes.",
  "work-at.apply.title": "Ready to join us?",
  "work-at.apply.text":
    "Send us your application or contact us to learn more about available positions.",
  "work-at.apply.cta": "Apply now",
  "work-at.apply.email": "Or send an email",
};

registerSegments({ fr, en });
