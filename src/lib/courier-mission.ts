export interface CourierMission {
  missionId: string;
  reference: string;
  courierName: string;
  courierPhone: string;
  motoPlate: string;
  pickupAddress: string;
  destinationAddress: string;
  status: "en_route_pickup" | "colis_recupere" | "en_transit_atelier" | "livre";
  etaMinutes: number;
  progressPercent: number;
}

export const MOCK_COURIER_MISSION: CourierMission = {
  missionId: "CR-2026-881",
  reference: "SAV-8492",
  courierName: "Rodrigue Dossou",
  courierPhone: "+229 97 00 12 34",
  motoPlate: "BJ-AB-4491",
  pickupAddress: "Immeuble Marina, Boulevard de la Marina, Cotonou",
  destinationAddress: "Atelier Allô Techno, Zogbadjè / UAC, Abomey-Calavi",
  status: "en_transit_atelier",
  etaMinutes: 18,
  progressPercent: 65,
};
