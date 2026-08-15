-- ============================================================================
-- Migration: 20260821000000_audit_soft_delete_trgm_improvements.sql
-- Optimisations DB: Soft-Delete, Trigram Search, Triggers d'audit DB & Vues KPI
-- ============================================================================

-- 1. Extension Trigram pour recherche floue haute performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Soft-delete columns
ALTER TABLE public.equipment 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.reservations 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 3. Performance & Trigram Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_name_trgm 
  ON public.equipment USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_equipment_serial_trgm 
  ON public.equipment USING gin (serial_number gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_equipment_asset_tag_trgm 
  ON public.equipment USING gin (asset_tag gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_equipment_deleted_at 
  ON public.equipment (deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at 
  ON public.organizations (deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_deleted_at 
  ON public.reservations (deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_reference_trgm 
  ON public.reservations USING gin (reference gin_trgm_ops);

-- 4. Audit Log Trigger Function
CREATE OR REPLACE FUNCTION public.fn_audit_log_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_action text;
  v_details jsonb;
  v_res_id uuid;
BEGIN
  -- Récupération de l'utilisateur courant
  v_user_id := auth.uid();
  v_action := TG_TABLE_NAME || '.' || TG_OP;

  IF (TG_OP = 'DELETE') THEN
    v_details := jsonb_build_object('old', to_jsonb(OLD));
    IF TG_TABLE_NAME = 'reservations' THEN
      v_res_id := OLD.id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    IF TG_TABLE_NAME = 'reservations' THEN
      v_res_id := NEW.id;
    END IF;
  ELSE
    v_details := jsonb_build_object('new', to_jsonb(NEW));
    IF TG_TABLE_NAME = 'reservations' THEN
      v_res_id := NEW.id;
    END IF;
  END IF;

  INSERT INTO public.audit_log (
    user_id,
    action,
    details,
    reservation_id,
    created_at
  ) VALUES (
    v_user_id,
    v_action,
    v_details,
    v_res_id,
    now()
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- L'audit ne doit jamais bloquer la transaction principale
    RAISE WARNING 'Audit log trigger error: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attachement des triggers d'audit sur les tables sensibles (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_audit_payments ON public.payments;
    CREATE TRIGGER trg_audit_payments
      AFTER INSERT OR UPDATE OR DELETE ON public.payments
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_change();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_parts' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_audit_inventory_parts ON public.inventory_parts;
    CREATE TRIGGER trg_audit_inventory_parts
      AFTER UPDATE OR DELETE ON public.inventory_parts
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_change();
  END IF;
END $$;

-- 5. Vue d'agrégation KPI pour éviter les calculs en mémoire
CREATE OR REPLACE VIEW public.v_kpi_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'terminee' OR status = 'livre') AS total_completed,
  COUNT(*) FILTER (WHERE status IN ('en_cours', 'pieces', 'pret')) AS total_in_progress,
  COUNT(*) FILTER (WHERE status = 'en_attente') AS total_pending,
  COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) AS total_revenue_paid,
  COUNT(*) AS total_reservations,
  now() AS computed_at
FROM public.reservations
WHERE deleted_at IS NULL;

-- Permissions pour la vue
GRANT SELECT ON public.v_kpi_summary TO authenticated;
