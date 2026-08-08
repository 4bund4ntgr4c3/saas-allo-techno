-- Alertes stock bas : seuil configurable par accessoire.
-- Quand la quantité tombe sous ce seuil, le cron envoie une alerte
-- WhatsApp à l'atelier. Par défaut 5 (alerte quand <= 5 en stock).

ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS low_stock_threshold int NOT NULL DEFAULT 5;
