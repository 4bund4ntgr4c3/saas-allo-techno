-- Seed initial du contenu éditable (blog + avis) pour que la lecture
-- Supabase prenne le dessus sur le repli statique. Idempotent (ON CONFLICT).
-- Le stock est laissé vide = tous les produits "non suivis" (le décrément reste
-- accepté) jusqu'à ce que l'équipe saisisse les quantités.

insert into public.blog_posts (slug, title, excerpt, date, category, reading_time, body)
values
  (
    'reparation-telephone-abomey-calavi-guide',
    'Faire réparer son téléphone à Abomey-Calavi : le guide complet 2026',
    'Prix moyens, délais, quartiers desservis et questions à poser avant de confier votre smartphone à un atelier d''Abomey-Calavi.',
    '2026-07-28',
    'Local',
    '7 min',
    '["Abomey-Calavi concentre aujourd''hui une grande partie des réparations de smartphones de l''agglomération de Cotonou. Entre Zogbadjè, Tankpè, Akassato et Godomey, l''offre est large mais très inégale.","Premier réflexe : exiger un diagnostic écrit et gratuit. Un atelier sérieux vous annonce la panne réelle, la pièce utilisée et la durée de garantie avant de démonter quoi que ce soit.","Deuxième réflexe : la traçabilité. Un numéro de dossier permet de suivre l''avancement de la réparation et de prouver le dépôt de l''appareil.","Troisième réflexe : les délais. Un écran ou une batterie se remplace en moins d''une heure. Une micro-soudure demande 24 à 72 h.","Enfin, pensez à la sauvegarde. Avant tout dépôt, sauvegardez vos photos. Notre atelier de Zogbadjè peut vous accompagner gratuitement."]'
  ),
  (
    'payer-reparation-mobile-money-benin',
    'Payer sa réparation en Mobile Money au Bénin : ce qu''il faut savoir',
    'MoMo, Celtiis Cash, espèces ou virement : comment sécuriser le paiement et obtenir une vraie facture.',
    '2026-06-05',
    'Local',
    '4 min',
    '["À Abomey-Calavi, la majorité des réparations se règlent aujourd''hui en Mobile Money. C''est pratique, mais quelques précautions évitent les mauvaises surprises.","Ne payez jamais l''intégralité avant le diagnostic. Un acompte sur pièce commandée est normal ; un paiement complet à l''avance ne l''est pas.","Vérifiez que le numéro Mobile Money correspond bien au nom commercial de l''atelier.","Exigez une facture mentionnant le modèle, la panne, la pièce posée et la durée de garantie.","Conservez le SMS de confirmation de transaction : associé à votre numéro de dossier, il permet de retrouver l''historique complet de l''intervention."]'
  ),
  (
    'prolonger-batterie-smartphone-benin',
    'Prolonger la batterie de son smartphone au Bénin : 5 gestes simples',
    'Chaleur, coupures de courant, chargeurs bas de gamme : comment préserver la santé de votre batterie.',
    '2026-06-18',
    'Guides',
    '6 min',
    '["La chaleur est le premier ennemi d''une batterie lithium-ion. Au Bénin, laisser son téléphone en plein soleil ou dans une voiture fermée accélère le vieillissement des cellules.","Évitez les charges complètes à 100 % en continu : la plage idéale se situe entre 20 % et 80 %.","Utilisez un chargeur certifié adapté à la puissance de votre appareil. Les chargeurs bas de gamme délivrent une tension instable qui abîme le circuit de charge.","Après une coupure de courant, attendez la stabilisation du réseau avant de rebrancher.","Si votre autonomie chute brutalement, faites contrôler la santé de la batterie : le diagnostic est gratuit chez Allô Techno."]'
  ),
  (
    'harmattan-poussiere-smartphone-calavi',
    'Harmattan et poussière : protéger son téléphone à Calavi',
    'Port de charge encrassé, micro étouffé, console qui surchauffe : la saison sèche fait des dégâts.',
    '2026-06-30',
    'Local',
    '5 min',
    '["Pendant l''harmattan, la poussière fine s''infiltre partout : port de charge, grilles de micro, radiateurs de console et d''ordinateur.","Symptôme n°1 : le câble ne tient plus ou la charge est intermittente. La plupart du temps, c''est un tampon de poussière au fond du port ; un nettoyage suffit.","Symptôme n°2 : vos correspondants ne vous entendent plus. La grille du micro est colmatée.","Symptôme n°3 : la console ou le PC devient bruyant et s''éteint seul. Un dépoussiérage annuel avec changement de pâte thermique évite la panne.","Un nettoyage préventif en atelier se fait en moins de 30 minutes."]'
  )
on conflict (slug) do nothing;

insert into public.reviews (name, city, rating, text, device)
values
  ('Koffi S.', 'Abomey-Calavi', 5, 'Service impeccable à Calavi. Mon iPhone 15 Pro Max a été réparé en moins d''une heure.', 'iPhone 15 Pro Max'),
  ('Mariam A.', 'Cotonou', 5, 'Devis clair, prix respecté, facture fournie. Ma batterie tient à nouveau deux jours.', 'Galaxy A54'),
  ('Yves D.', 'Godomey', 5, 'Micro-soudure sur mon MacBook que deux autres ateliers avaient refusée. Machine sauvée.', 'MacBook Pro M1'),
  ('Rachida B.', 'Abomey-Calavi', 4, 'Bon suivi WhatsApp du dossier. Une journée de plus que prévu mais résultat parfait.', 'PlayStation 5'),
  ('Serge H.', 'Calavi', 5, 'Écran changé pendant que j''attendais. Paiement Mobile Money, très pratique.', 'Smartphone'),
  ('Aline T.', 'Cotonou', 5, 'Notre société fait entretenir une vingtaine de postes ici. Sérieux et factures en règle.', 'Parc informatique');