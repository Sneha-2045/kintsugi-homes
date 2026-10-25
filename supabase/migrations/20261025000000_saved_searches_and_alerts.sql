CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(filters) = 'object'),
  criteria_hash text NOT NULL CHECK (criteria_hash ~ '^[a-f0-9]{64}$'),
  alerts_enabled boolean NOT NULL DEFAULT false,
  alert_frequency text NOT NULL DEFAULT 'disabled'
    CHECK (alert_frequency IN ('disabled', 'daily', 'weekly')),
  last_checked_at timestamptz,
  last_match_count integer CHECK (last_match_count IS NULL OR last_match_count >= 0),
  match_count_checked_at timestamptz,
  last_notification_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_searches_user_criteria_unique UNIQUE (user_id, criteria_hash),
  CONSTRAINT saved_searches_user_filters_unique UNIQUE (user_id, filters),
  CONSTRAINT saved_search_alert_frequency_consistent CHECK (
    (alerts_enabled AND alert_frequency IN ('daily', 'weekly')) OR
    (NOT alerts_enabled AND alert_frequency = 'disabled')
  )
);

CREATE INDEX saved_searches_active_alerts_idx
  ON public.saved_searches (alert_frequency, last_checked_at)
  WHERE alerts_enabled = true;

CREATE TABLE public.saved_search_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id uuid NOT NULL REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  source text NOT NULL,
  listing_id text NOT NULL,
  listing_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (saved_search_id, source, listing_id)
);

CREATE TABLE public.saved_search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id uuid NOT NULL REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  source text NOT NULL,
  listing_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('new', 'price_changed', 'status_changed', 'auction_changed')),
  event_key text NOT NULL UNIQUE,
  previous_value jsonb,
  current_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX saved_search_events_pending_idx
  ON public.saved_search_events (created_at)
  WHERE sent_at IS NULL;

CREATE TABLE public.saved_search_monitor_lock (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  locked_until timestamptz,
  last_search_id uuid
);
INSERT INTO public.saved_search_monitor_lock (id) VALUES (true);
GRANT SELECT, UPDATE ON public.saved_search_monitor_lock TO service_role;

CREATE OR REPLACE FUNCTION public.acquire_saved_search_monitor_lock()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE changed integer;
BEGIN
  UPDATE public.saved_search_monitor_lock
  SET locked_until = now() + interval '20 minutes'
  WHERE id = true AND (locked_until IS NULL OR locked_until < now());
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_saved_search_monitor_lock()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.saved_search_monitor_lock SET locked_until = NULL WHERE id = true;
$$;
GRANT EXECUTE ON FUNCTION public.acquire_saved_search_monitor_lock() TO service_role;
GRANT EXECUTE ON FUNCTION public.release_saved_search_monitor_lock() TO service_role;
REVOKE ALL ON FUNCTION public.acquire_saved_search_monitor_lock() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_saved_search_monitor_lock() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_search_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_search_monitor_lock ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_search_matches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_search_events TO service_role;

CREATE POLICY "Users manage their own saved searches" ON public.saved_searches
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
