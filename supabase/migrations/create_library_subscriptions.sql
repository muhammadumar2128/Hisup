-- ============================================================
-- FIX: Create missing library_subscriptions table
--
-- The library subscription feature requires this table to track 
-- active subscriptions, but it was missing from the initial schema.
-- 
-- HOW TO RUN: Paste this in the Supabase SQL Editor and click "Run"
-- ============================================================

CREATE TABLE IF NOT EXISTS public.library_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    UNIQUE(student_id)
);

-- Enable RLS
ALTER TABLE public.library_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view their own subscriptions"
ON public.library_subscriptions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own subscriptions"
ON public.library_subscriptions FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own subscriptions"
ON public.library_subscriptions FOR UPDATE
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Admins and librarians have full access"
ON public.library_subscriptions FOR ALL
TO authenticated
USING (
    public.get_current_user_role() IN ('Admin', 'Librarian')
);
