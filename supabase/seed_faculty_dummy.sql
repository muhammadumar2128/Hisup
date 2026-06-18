-- Dummy Faculty Seed Data for HiSUP
-- RUN THIS IN SUPABASE SQL EDITOR

DO $$ 
DECLARE
    v_role_id INT;
    v_dept_cs_id UUID;
    v_dept_ee_id UUID;
    
    -- Faculty 1
    v_f1_id UUID := 'faca0000-0000-4000-a000-000000000001';
    -- Faculty 2
    v_f2_id UUID := 'faca0000-0000-4000-a000-000000000002';
    -- Faculty 3
    v_f3_id UUID := 'faca0000-0000-4000-a000-000000000003';
BEGIN
    -- 1. Get Faculty Role ID
    SELECT id INTO v_role_id FROM public.roles WHERE role_name = 'Faculty';
    
    -- 2. Get Department IDs
    SELECT id INTO v_dept_cs_id FROM public.departments WHERE code = 'CS';
    SELECT id INTO v_dept_ee_id FROM public.departments WHERE code = 'EE';

    -- Note: auth.users insertion usually requires specific triggers or dashboard use.
    -- This script handles public schema links. 
    -- FOR AUTH: You must create these users in Supabase Dashboard -> Authentication
    -- with the following IDs and emails, or use the project signup if allowed.

    -- Faculty 1: Dr. Ahmed (CS)
    INSERT INTO public.users (id, email, role_id, status)
    VALUES (v_f1_id, 'ahmed.cs@hitecuni.edu.pk', v_role_id, 'Active')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, first_name, last_name, gender, dob)
    VALUES (v_f1_id, 'Ahmed', 'Ali', 'Male', '1980-05-15')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.faculty_profiles (id, employee_id, designation, specialization, joining_date)
    VALUES (v_f1_id, 'FAC-CS-001', 'Associate Professor', 'Machine Learning', '2015-09-01')
    ON CONFLICT (id) DO NOTHING;

    -- Faculty 2: Dr. Sara (CS)
    INSERT INTO public.users (id, email, role_id, status)
    VALUES (v_f2_id, 'sara.cs@hitecuni.edu.pk', v_role_id, 'Active')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, first_name, last_name, gender, dob)
    VALUES (v_f2_id, 'Sara', 'Khan', 'Female', '1985-03-22')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.faculty_profiles (id, employee_id, designation, specialization, joining_date)
    VALUES (v_f2_id, 'FAC-CS-002', 'Assistant Professor', 'Cyber Security', '2018-02-15')
    ON CONFLICT (id) DO NOTHING;

    -- Faculty 3: Dr. Usman (EE)
    INSERT INTO public.users (id, email, role_id, status)
    VALUES (v_f3_id, 'usman.ee@hitecuni.edu.pk', v_role_id, 'Active')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, first_name, last_name, gender, dob)
    VALUES (v_f3_id, 'Usman', 'Tariq', 'Male', '1978-11-10')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.faculty_profiles (id, employee_id, designation, specialization, joining_date)
    VALUES (v_f3_id, 'FAC-EE-001', 'Professor', 'Power Systems', '2010-08-20')
    ON CONFLICT (id) DO NOTHING;

END $$;
