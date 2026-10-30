/*
# Investment/Rental/Partnership Requests, Contracts, Projects

1. New Tables
- `land_investment_requests` — investment requests with land_id, requester_id, investment_type, duration, project_description, budget, experience, notes, status.
- `rental_requests` — rental requests with land_id, requester_id, proposed_terms, duration, budget, notes, status.
- `partnership_requests` — partnership requests with land_id, requester_id, proposed_terms, duration, notes, status.
- `contracts` — digital contracts with contract_number, land_id, contract_type, start/end dates, terms, status, file_url.
- `contract_parties` — parties linked to a contract (user_id, role).
- `projects` — agricultural projects on lands.
- `project_updates` — updates for projects.

2. Security
- RLS on all tables. Requesters can see/modify their own requests. Land owners can see requests on their lands. Admins can see all.
- Contracts: only parties can see their contracts. Admin can see all.
- Projects: public SELECT for published lands' projects; owner and admin can manage.

3. Notes
- All requester_id columns default to auth.uid().
- Status defaults to PENDING.
- Indexes on land_id, requester_id, status for all request tables.
*/

-- Investment requests
CREATE TABLE IF NOT EXISTS public.land_investment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id uuid NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_type text,
  duration_months integer,
  project_description text,
  budget numeric,
  experience text,
  notes text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Rental requests
CREATE TABLE IF NOT EXISTS public.rental_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id uuid NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  proposed_terms text,
  duration_months integer,
  budget numeric,
  notes text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Partnership requests
CREATE TABLE IF NOT EXISTS public.partnership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id uuid NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  proposed_terms text,
  duration_months integer,
  notes text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text NOT NULL UNIQUE,
  land_id uuid NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  contract_type text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  terms text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING_SIGNATURE')),
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contract parties
CREATE TABLE IF NOT EXISTS public.contract_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contract_id, user_id)
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id uuid NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED')),
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Project updates
CREATE TABLE IF NOT EXISTS public.project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  update_text text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.land_investment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- Investment request policies
DROP POLICY IF EXISTS "select_own_investment_requests" ON public.land_investment_requests;
CREATE POLICY "select_own_investment_requests" ON public.land_investment_requests FOR SELECT
  TO authenticated USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "select_investment_requests_land_owner" ON public.land_investment_requests;
CREATE POLICY "select_investment_requests_land_owner" ON public.land_investment_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = land_investment_requests.land_id AND lands.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "select_all_investment_requests_admin" ON public.land_investment_requests;
CREATE POLICY "select_all_investment_requests_admin" ON public.land_investment_requests FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_investment_requests" ON public.land_investment_requests;
CREATE POLICY "insert_investment_requests" ON public.land_investment_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "update_own_investment_requests" ON public.land_investment_requests;
CREATE POLICY "update_own_investment_requests" ON public.land_investment_requests FOR UPDATE
  TO authenticated USING (auth.uid() = requester_id) WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "update_investment_requests_admin" ON public.land_investment_requests;
CREATE POLICY "update_investment_requests_admin" ON public.land_investment_requests FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Rental request policies
DROP POLICY IF EXISTS "select_own_rental_requests" ON public.rental_requests;
CREATE POLICY "select_own_rental_requests" ON public.rental_requests FOR SELECT
  TO authenticated USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "select_rental_requests_land_owner" ON public.rental_requests;
CREATE POLICY "select_rental_requests_land_owner" ON public.rental_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = rental_requests.land_id AND lands.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "select_all_rental_requests_admin" ON public.rental_requests;
CREATE POLICY "select_all_rental_requests_admin" ON public.rental_requests FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_rental_requests" ON public.rental_requests;
CREATE POLICY "insert_rental_requests" ON public.rental_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "update_own_rental_requests" ON public.rental_requests;
CREATE POLICY "update_own_rental_requests" ON public.rental_requests FOR UPDATE
  TO authenticated USING (auth.uid() = requester_id) WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "update_rental_requests_admin" ON public.rental_requests;
CREATE POLICY "update_rental_requests_admin" ON public.rental_requests FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Partnership request policies
DROP POLICY IF EXISTS "select_own_partnership_requests" ON public.partnership_requests;
CREATE POLICY "select_own_partnership_requests" ON public.partnership_requests FOR SELECT
  TO authenticated USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "select_partnership_requests_land_owner" ON public.partnership_requests;
CREATE POLICY "select_partnership_requests_land_owner" ON public.partnership_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = partnership_requests.land_id AND lands.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "select_all_partnership_requests_admin" ON public.partnership_requests;
CREATE POLICY "select_all_partnership_requests_admin" ON public.partnership_requests FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_partnership_requests" ON public.partnership_requests;
CREATE POLICY "insert_partnership_requests" ON public.partnership_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "update_own_partnership_requests" ON public.partnership_requests;
CREATE POLICY "update_own_partnership_requests" ON public.partnership_requests FOR UPDATE
  TO authenticated USING (auth.uid() = requester_id) WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "update_partnership_requests_admin" ON public.partnership_requests;
CREATE POLICY "update_partnership_requests_admin" ON public.partnership_requests FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Contract policies
DROP POLICY IF EXISTS "select_own_contracts" ON public.contracts;
CREATE POLICY "select_own_contracts" ON public.contracts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contract_parties WHERE contract_parties.contract_id = contracts.id AND contract_parties.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "select_all_contracts_admin" ON public.contracts;
CREATE POLICY "select_all_contracts_admin" ON public.contracts FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_contracts" ON public.contracts;
CREATE POLICY "insert_contracts" ON public.contracts FOR INSERT
  TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.lands WHERE lands.id = contracts.land_id AND (lands.owner_id = auth.uid() OR public.is_admin()))
  );

DROP POLICY IF EXISTS "update_contracts_admin" ON public.contracts;
CREATE POLICY "update_contracts_admin" ON public.contracts FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Contract parties policies
DROP POLICY IF EXISTS "select_own_contract_parties" ON public.contract_parties;
CREATE POLICY "select_own_contract_parties" ON public.contract_parties FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_contract_parties_admin" ON public.contract_parties;
CREATE POLICY "select_contract_parties_admin" ON public.contract_parties FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_contract_parties" ON public.contract_parties;
CREATE POLICY "insert_contract_parties" ON public.contract_parties FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- Project policies
DROP POLICY IF EXISTS "select_projects_published" ON public.projects;
CREATE POLICY "select_projects_published" ON public.projects FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = projects.land_id AND lands.is_published = true)
  );

DROP POLICY IF EXISTS "select_own_projects" ON public.projects;
CREATE POLICY "select_own_projects" ON public.projects FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = projects.land_id AND lands.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "select_all_projects_admin" ON public.projects;
CREATE POLICY "select_all_projects_admin" ON public.projects FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_own_projects" ON public.projects;
CREATE POLICY "insert_own_projects" ON public.projects FOR INSERT
  TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.lands WHERE lands.id = projects.land_id AND lands.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_projects" ON public.projects;
CREATE POLICY "update_own_projects" ON public.projects FOR UPDATE
  TO authenticated USING (
  EXISTS (SELECT 1 FROM public.lands WHERE lands.id = projects.land_id AND lands.owner_id = auth.uid())
  ) WITH CHECK (
  EXISTS (SELECT 1 FROM public.lands WHERE lands.id = projects.land_id AND lands.owner_id = auth.uid())
  );

-- Project update policies
DROP POLICY IF EXISTS "select_project_updates" ON public.project_updates;
CREATE POLICY "select_project_updates" ON public.project_updates FOR SELECT
  TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p JOIN public.lands l ON l.id = p.land_id WHERE p.id = project_updates.project_id AND (l.owner_id = auth.uid() OR l.is_published = true OR public.is_admin()))
  );

DROP POLICY IF EXISTS "insert_project_updates" ON public.project_updates;
CREATE POLICY "insert_project_updates" ON public.project_updates FOR INSERT
  TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p JOIN public.lands l ON l.id = p.land_id WHERE p.id = project_updates.project_id AND (l.owner_id = auth.uid() OR public.is_admin()))
  );

-- Auto-update triggers
DROP TRIGGER IF EXISTS investment_requests_updated_at ON public.land_investment_requests;
CREATE TRIGGER investment_requests_updated_at
  BEFORE UPDATE ON public.land_investment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS rental_requests_updated_at ON public.rental_requests;
CREATE TRIGGER rental_requests_updated_at
  BEFORE UPDATE ON public.rental_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS partnership_requests_updated_at ON public.partnership_requests;
CREATE TRIGGER partnership_requests_updated_at
  BEFORE UPDATE ON public.partnership_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS contracts_updated_at ON public.contracts;
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_investment_requests_land_id ON public.land_investment_requests(land_id);
CREATE INDEX IF NOT EXISTS idx_investment_requests_requester_id ON public.land_investment_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_investment_requests_status ON public.land_investment_requests(status);
CREATE INDEX IF NOT EXISTS idx_rental_requests_land_id ON public.rental_requests(land_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_requester_id ON public.rental_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_status ON public.rental_requests(status);
CREATE INDEX IF NOT EXISTS idx_partnership_requests_land_id ON public.partnership_requests(land_id);
CREATE INDEX IF NOT EXISTS idx_partnership_requests_requester_id ON public.partnership_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_partnership_requests_status ON public.partnership_requests(status);
CREATE INDEX IF NOT EXISTS idx_contracts_land_id ON public.contracts(land_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_parties_contract_id ON public.contract_parties(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_parties_user_id ON public.contract_parties(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_land_id ON public.projects(land_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON public.project_updates(project_id);
