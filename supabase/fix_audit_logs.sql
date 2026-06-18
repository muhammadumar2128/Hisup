-- ==========================================
-- MANUAL SCHEMA RECOVERY: AUDIT LOGS
-- ==========================================
-- Run this in Supabase SQL Editor to fix the 404 error

-- 1. Create the table explicitly
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    row_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create Admin Policy
DROP POLICY IF EXISTS audit_logs_admin_all ON public.audit_logs;
CREATE POLICY audit_logs_admin_all ON public.audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() AND r.role_name = 'Admin'
        )
    );

-- 4. FORCE SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';
