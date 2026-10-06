CREATE TABLE public.listing_issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL CHECK (char_length(btrim(listing_id)) BETWEEN 1 AND 100),
  issue_type text NOT NULL CHECK (issue_type IN ('price', 'availability', 'details', 'source', 'other')),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 10 AND 2000),
  contact_email text CHECK (contact_email IS NULL OR char_length(contact_email) <= 254),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX listing_issue_reports_created_at_idx
  ON public.listing_issue_reports (created_at DESC);

GRANT INSERT ON public.listing_issue_reports TO anon, authenticated;
GRANT SELECT ON public.listing_issue_reports TO authenticated;
GRANT ALL ON public.listing_issue_reports TO service_role;
ALTER TABLE public.listing_issue_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitors can submit listing issue reports"
  ON public.listing_issue_reports
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read listing issue reports"
  ON public.listing_issue_reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));