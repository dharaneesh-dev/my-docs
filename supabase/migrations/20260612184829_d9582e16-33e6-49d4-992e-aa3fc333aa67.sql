CREATE TABLE public.visitor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text,
  country text,
  region text,
  city text,
  user_agent text,
  page_path text,
  referrer text,
  consent text NOT NULL CHECK (consent IN ('all','necessary')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.visitor_logs TO anon, authenticated;
GRANT ALL ON public.visitor_logs TO service_role;

ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visit logs"
  ON public.visitor_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX visitor_logs_created_at_idx ON public.visitor_logs (created_at DESC);