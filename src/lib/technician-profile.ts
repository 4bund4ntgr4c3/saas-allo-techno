export interface TechnicianProfile {
  id: string;
  fullName: string;
  role: string;
  matricule: string;
  certifications: string[];
  interventionsCompleted: number;
  rating: number;
}

export const DEFAULT_TECH_PROFILE: TechnicianProfile = {
  id: "tech-01",
  fullName: "Koffi Mensah",
  role: "Expert Micro-Soudure & Architecte Réseau",
  matricule: "AT-TECH-2026-08",
  certifications: [
    "Apple Certified Mac Technician (ACMT)",
    "Spécialiste Micro-Soudure SMD & Reballing BGA",
    "Certification Dell ProSupport IT & Serveurs PowerEdge",
  ],
  interventionsCompleted: 482,
  rating: 4.9,
};
