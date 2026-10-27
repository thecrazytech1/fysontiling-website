CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  suburb text NOT NULL DEFAULT '',
  project_type text NOT NULL DEFAULT '',
  review text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved testimonials"
  ON public.testimonials FOR SELECT TO anon
  USING (approved = true);

CREATE INDEX testimonials_approved_created_idx ON public.testimonials (approved, created_at DESC);