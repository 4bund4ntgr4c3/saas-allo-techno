import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  "loyalty.use": "Utiliser mes points fidélité",
  "loyalty.use.balance": "{0} pts = {1} FCFA de réduction",
  "loyalty.use.applied": "Réduction de {0} FCFA appliquée",
};

const en = {
  "loyalty.use": "Use loyalty points",
  "loyalty.use.balance": "{0} pts = {1} FCFA off",
  "loyalty.use.applied": "{0} FCFA discount applied",
};

registerSegments({ fr, en });
