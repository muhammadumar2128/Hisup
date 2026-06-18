-- Fix for Admin User Management
-- This script enables RLS and adds policies for the 'users' and 'profiles' tables
-- to ensure Admins can see and manage all users.

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own user record" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. USERS Table Policies
-- Admins: Full access
CREATE POLICY "Admins can manage all users" 
ON public.users 
FOR ALL 
TO authenticated 
USING (public.get_current_user_role() = 'Admin');

-- Authenticated Users: View own record
CREATE POLICY "Users can view own user record" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);


-- 4. PROFILES Table Policies
-- Admins: Full access
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (public.get_current_user_role() = 'Admin');

-- Authenticated Users: View own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Authenticated Users: Update own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 5. STUDENT_PROFILES Table Policies
DROP POLICY IF EXISTS "Students can view own student profile" ON public.student_profiles;
CREATE POLICY "Students can view own student profile" 
ON public.student_profiles 
FOR SELECT 
TO authenticated 
USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all student profiles" ON public.student_profiles;
CREATE POLICY "Admins can manage all student profiles" 
ON public.student_profiles 
FOR ALL 
TO authenticated 
USING (public.get_current_user_role() = 'Admin');

-- 6. Special case: Allow public/anon to read basic roles (needed for login/signup)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read roles" ON public.roles;
CREATE POLICY "Allow public read roles" ON public.roles FOR SELECT USING (true);
