// ============================================================================
// Allô Techno — Générateur de PSSI & Charte Informatique Entreprise
// Rédaction automatisée des règles de sécurité, télétravail et conformité APDP.
// ============================================================================

export interface PssiDocument {
  title: string;
  version: string;
  companyName: string;
  generatedDate: string;
  sections: {
    title: string;
    rules: string[];
  }[];
}

export function generatePssiPolicy(
  companyName: string,
  allowRemoteWork: boolean = true,
  requireBitLocker: boolean = true,
  strictUsbBan: boolean = true,
): PssiDocument {
  return {
    title: `Politique de Sécurité des Systèmes d'Information (PSSI) — ${companyName}`,
    version: "1.0-CONFORME-APDP",
    companyName,
    generatedDate: new Date().toLocaleDateString("fr-FR", { dateStyle: "long" }),
    sections: [
      {
        title: "1. Gestion des Mots de Passe & Authentification",
        rules: [
          "Longueur minimale de 12 caractères combinant majuscules, chiffres et caractères spéciaux.",
          "Activation obligatoire de l'authentification multifacteur (MFA) sur tous les comptes e-mail professionnels.",
          "Interdiction formelle de noter ses mots de passe sur des post-its ou documents non chiffrés.",
        ],
      },
      {
        title: "2. Chiffrement Matériel & Sécurité des Postes de Travail",
        rules: [
          requireBitLocker
            ? "Chiffrement intégral obligatoire du disque dur principal (BitLocker ou FileVault) avec sauvegarde de la clé de récupération auprès de la DSI."
            : "Protection par mot de passe système au démarrage.",
          "Verrouillage automatique de la session utilisateur après 5 minutes d'inactivité.",
          strictUsbBan
            ? "Interdiction stricte de connecter des clés USB ou disques externes personnels sans analyse préalable par l'antivirus de l'entreprise."
            : "Analyse antivirus obligatoire de tout support amovible.",
        ],
      },
      {
        title: "3. Télétravail & Utilisation Nomade",
        rules: [
          allowRemoteWork
            ? "Connexion obligatoire via le VPN sécurisé de l'entreprise pour accéder aux serveurs et fichiers internes."
            : "L'accès aux données professionnelles est strictement restreint aux locaux de l'entreprise.",
          "Interdiction de se connecter sur des réseaux Wi-Fi publics ouverts (hôtels, cafés) sans VPN actif.",
          "Signalement immédiat de toute perte ou vol d'appareil dans un délai maximum de 2 heures auprès de la DSI et de l'APDP Bénin.",
        ],
      },
    ],
  };
}
