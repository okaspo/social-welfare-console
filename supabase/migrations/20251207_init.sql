-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'STANDARD', 'PRO', 'ENTERPRISE')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create profiles table (links auth.users to organizations)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for Organizations
-- Members can view their own organization
CREATE POLICY "Members can view own organization" ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM profiles
            WHERE profiles.id = auth.uid()
        )
    );

-- Policies for Profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (id = auth.uid());

-- Users can view profiles of members in the same organization
CREATE POLICY "Members can view colleagues" ON profiles
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid()
        )
    );
