CREATE TABLE public.project_enquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 email text NOT NULL,
 phone text NOT NULL DEFAULT '',
 suburb text NOT NULL,
 service text NOT NULL,
 message text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.project_enquiries TO service_role;
ALTER TABLE public.project_enquiries ENABLE ROW LEVEL SECURITY;
CREATE INDEX project_enquiries_email_created_idx ON public.project_enquiries(email, created_at);