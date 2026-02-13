-- RLS Policy Updates for Multi-tenancy
-- Allow access to resources via Organization membership (through Brand)

-- 1. AEO Analyses
DROP POLICY IF EXISTS "Users can view own analyses" ON public.aeo_analyses;
CREATE POLICY "Org members can view analyses"
  ON public.aeo_analyses FOR SELECT
  USING (
    (auth.uid() = user_id) OR
    EXISTS (
      SELECT 1 FROM public.brands
      JOIN public.organization_members ON brands.organization_id = organization_members.organization_id
      WHERE brands.id = aeo_analyses.brand_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- 2. Keywords
DROP POLICY IF EXISTS "Users can view own keywords" ON public.keywords;
CREATE POLICY "Org members can view keywords"
  ON public.keywords FOR SELECT
  USING (
    (auth.uid() = user_id) OR
    EXISTS (
      SELECT 1 FROM public.brands
      JOIN public.organization_members ON brands.organization_id = organization_members.organization_id
      WHERE brands.id = keywords.brand_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- 3. Competitors
DROP POLICY IF EXISTS "Users can view own competitors" ON public.competitors;
CREATE POLICY "Org members can view competitors"
  ON public.competitors FOR SELECT
  USING (
    (auth.uid() = user_id) OR
    EXISTS (
      SELECT 1 FROM public.brands
      JOIN public.organization_members ON brands.organization_id = organization_members.organization_id
      WHERE brands.id = competitors.brand_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- 4. Recommendations
DROP POLICY IF EXISTS "Users can view own recommendations" ON public.recommendations;
CREATE POLICY "Org members can view recommendations"
  ON public.recommendations FOR SELECT
  USING (
    (auth.uid() = user_id) OR
    EXISTS (
      SELECT 1 FROM public.brands
      JOIN public.organization_members ON brands.organization_id = organization_members.organization_id
      WHERE brands.id = recommendations.brand_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- 5. Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Org members can view notifications"
  ON public.notifications FOR SELECT
  USING (
    (auth.uid() = user_id) OR
    EXISTS (
      SELECT 1 FROM public.brands
      JOIN public.organization_members ON brands.organization_id = organization_members.organization_id
      WHERE brands.id = notifications.brand_id
      AND organization_members.user_id = auth.uid()
    )
  );
