-- Create Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Organization Members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Policies for Organizations
CREATE POLICY "Users can view organizations they are members of"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update organization details"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- Policies for Organization Members
CREATE POLICY "Members can view other members in their organization"
  ON public.organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS my_membership
      WHERE my_membership.organization_id = organization_members.organization_id
      AND my_membership.user_id = auth.uid()
    )
  );

-- Add organization_id to Brands (Migration)
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update Brands RLS to allow Organization access
DROP POLICY IF EXISTS "Users can view own brands" ON public.brands;
CREATE POLICY "Users can view organization brands"
  ON public.brands FOR SELECT
  USING (
    (auth.uid() = user_id) OR -- Keep legacy access for now
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = brands.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_brands_organization_id ON public.brands(organization_id);

-- Migration Function: Create default organization for existing users
-- This is a one-time migration to ensure existing users have an organization
DO $$
DECLARE
  user_record RECORD;
  org_id UUID;
BEGIN
  FOR user_record IN SELECT * FROM public.profiles LOOP
    -- Check if user already has an org (skip if so, though simple check here)
    -- Ideally we create one org per user named "Org [User Name]"
    
    -- Create Organization
    INSERT INTO public.organizations (name, slug)
    VALUES (
      COALESCE(user_record.company_name, 'My Organization'), 
      lower(regexp_replace(uuid_generate_v4()::text, '[^a-zA-Z0-9]', '', 'g')) -- Temp unique slug
    ) RETURNING id INTO org_id;

    -- Create Membership
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_id, user_record.id, 'owner');

    -- Link User's Brands to this new Org
    UPDATE public.brands 
    SET organization_id = org_id 
    WHERE user_id = user_record.id AND organization_id IS NULL;
    
  END LOOP;
END;
$$;
