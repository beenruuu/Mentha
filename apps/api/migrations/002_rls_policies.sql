-- Mentha Backend - Row Level Security Policies
-- Ensures multi-tenant isolation at the database level

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES POLICIES
-- =============================================================================
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- =============================================================================
-- PROJECTS POLICIES
-- =============================================================================
CREATE POLICY "Users can view own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================================================
-- KEYWORDS POLICIES (via project ownership)
-- =============================================================================
CREATE POLICY "Users can view keywords of own projects"
    ON public.keywords FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = keywords.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create keywords in own projects"
    ON public.keywords FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = keywords.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update keywords in own projects"
    ON public.keywords FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = keywords.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete keywords in own projects"
    ON public.keywords FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = keywords.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- =============================================================================
-- SCAN JOBS POLICIES (via keyword -> project ownership)
-- =============================================================================
CREATE POLICY "Users can view scan jobs of own keywords"
    ON public.scan_jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.keywords k
            JOIN public.projects p ON k.project_id = p.id
            WHERE k.id = scan_jobs.keyword_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create scan jobs for own keywords"
    ON public.scan_jobs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.keywords k
            JOIN public.projects p ON k.project_id = p.id
            WHERE k.id = scan_jobs.keyword_id
            AND p.user_id = auth.uid()
        )
    );

-- =============================================================================
-- SCAN RESULTS POLICIES (via job -> keyword -> project ownership)
-- =============================================================================
CREATE POLICY "Users can view scan results of own jobs"
    ON public.scan_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.scan_jobs j
            JOIN public.keywords k ON j.keyword_id = k.id
            JOIN public.projects p ON k.project_id = p.id
            WHERE j.id = scan_results.job_id
            AND p.user_id = auth.uid()
        )
    );

-- =============================================================================
-- CITATIONS POLICIES (via result -> job -> keyword -> project ownership)
-- =============================================================================
CREATE POLICY "Users can view citations of own results"
    ON public.citations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.scan_results r
            JOIN public.scan_jobs j ON r.job_id = j.id
            JOIN public.keywords k ON j.keyword_id = k.id
            JOIN public.projects p ON k.project_id = p.id
            WHERE r.id = citations.result_id
            AND p.user_id = auth.uid()
        )
    );

-- =============================================================================
-- SERVICE ROLE BYPASS (for backend workers)
-- =============================================================================
-- Note: The service_role key bypasses RLS automatically in Supabase.
-- Workers should use the service_role key to insert scan results.
