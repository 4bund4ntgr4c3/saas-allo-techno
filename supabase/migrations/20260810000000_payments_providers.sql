-- Paiements FedaPay / KKiaPay : id technique de la transaction chez le
-- prestataire (transaction id FedaPay, token KKiaPay). Les webhooks s'en
-- servent pour retrouver la ligne payments correspondante.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_tx_id text;

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_tx_id_key
  ON public.payments (provider_tx_id)
  WHERE provider_tx_id IS NOT NULL;