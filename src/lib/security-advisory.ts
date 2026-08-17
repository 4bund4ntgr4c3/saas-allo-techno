// ============================================================================
// Allô Techno — Veille & Bulletin d'Alertes Cybersécurité Matérielle (DSI)
// Surveillance des failles Zero-Day, vulnérabilités CPU/firmware et menaces UEMOA.
// ============================================================================

export interface SecurityAdvisory {
  cveId: string;
  title: string;
  severity: "CRITIQUE (9.8)" | "ÉLEVÉ (8.4)" | "MOYEN (6.5)";
  affectedHardware: string;
  publishDate: string;
  mitigationAction: string;
  patchStatus: "Patch Disponible" | "Contournement Préconisé" | "Mise à Jour Firmware";
}

export const ACTIVE_SECURITY_ADVISORIES: SecurityAdvisory[] = [
  {
    cveId: "CVE-2026-4491",
    title: "Vulnérabilité d'Exécution de Code dans le Contrôleur Thunderbolt / USB4",
    severity: "CRITIQUE (9.8)",
    affectedHardware: "Laptops Dell Latitude & Lenovo ThinkPad (Intel 11th - 13th Gen)",
    publishDate: "14 Août 2026",
    mitigationAction: "Mettre à jour le BIOS vers la version 1.28.0 et désactiver l'accès DMA direct au démarrage.",
    patchStatus: "Patch Disponible",
  },
  {
    cveId: "CVE-2026-8802",
    title: "Contournement du Secure Boot via Clé USB Formatée Malicieusement",
    severity: "ÉLEVÉ (8.4)",
    affectedHardware: "PC Portables et Serveurs d'Entreprise HP / Dell",
    publishDate: "09 Août 2026",
    mitigationAction: "Activer le mot de passe administrateur BIOS et verrouiller l'ordre de boot en atelier.",
    patchStatus: "Mise à Jour Firmware",
  },
  {
    cveId: "CAMPAGNE-BJ-PHISH",
    title: "Campagne de Rançongiciels ciblant les PME par faux ordres de virement BCEAO",
    severity: "ÉLEVÉ (8.4)",
    affectedHardware: "Parcs Windows 10/11 & Serveurs de Fichiers SMB",
    publishDate: "02 Août 2026",
    mitigationAction: "Désactiver le protocole SMBv1, activer l'authentification 2FA et isoler les sauvegardes.",
    patchStatus: "Contournement Préconisé",
  },
];
