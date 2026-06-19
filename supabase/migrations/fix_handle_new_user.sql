-- ============================================================
-- FIX: handle_new_user() trigger
-- 
-- WHAT WAS BROKEN:
--   1. Always assigned 'Student' role regardless of metadata
--   2. Never created student_profiles (so students couldn't register for courses, view grades, etc.)
--   3. Never created faculty_profiles (so faculty had no employee ID, designation, etc.)
--
-- WHAT THIS FIX DOES:
--   1. Reads the 'role' from user_metadata and assigns the correct role_id
--   2. Creates student_profiles with auto-generated registration number for Student users
--   3. Creates faculty_profiles with employee_id, designation, etc. for Faculty users
--
-- HOW TO RUN: Paste this entire script in the Supabase SQL Editor and click "Run"
-- ============================================================

-- Ensure sequence exists for sequential registration numbers
CREATE SEQUENCE IF NOT EXISTS public.student_reg_seq START WITH 25;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_id INT;
    v_role_name VARCHAR;
    v_program_id UUID;
    v_reg_number VARCHAR;
    v_seq INT;
BEGIN
    -- 1. Read role from user_metadata, default to 'Student' if not provided
    v_role_name := COALESCE(NEW.raw_user_meta_data->>'role', 'Student');
    
    -- 2. Look up the role_id from the roles table
    SELECT id INTO v_role_id FROM public.roles WHERE role_name = v_role_name;
    
    -- If invalid role name was passed, fall back to Student
    IF v_role_id IS NULL THEN
        SELECT id INTO v_role_id FROM public.roles WHERE role_name = 'Student';
        v_role_name := 'Student';
    END IF;

    -- 3. Insert into public.users with the CORRECT role
    INSERT INTO public.users (id, email, role_id, status)
    VALUES (NEW.id, NEW.email, v_role_id, 'Active');

    -- 4. Insert into public.profiles (same as before)
    INSERT INTO public.profiles (id, first_name, last_name, phone, cnic, gender, dob, current_address, permanent_address)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'), 
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'cnic',
        NEW.raw_user_meta_data->>'gender',
        NULLIF(NEW.raw_user_meta_data->>'dob', '')::date,
        NEW.raw_user_meta_data->>'current_address',
        NEW.raw_user_meta_data->>'permanent_address'
    );

    -- 5. Create role-specific profile based on the actual role
    IF v_role_name = 'Student' THEN
        -- Auto-generate a unique sequential registration number: REG-YYYY-XXXX (incrementing)
        v_seq := nextval('public.student_reg_seq');
        v_reg_number := 'REG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_seq::text, 4, '0');
        
        -- Read program_id from metadata (passed during signup or admin creation)
        BEGIN
            v_program_id := NULLIF(NEW.raw_user_meta_data->>'program_id', '')::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_program_id := NULL;
        END;
        
        INSERT INTO public.student_profiles (id, registration_number, program_id, enrollment_status)
        VALUES (NEW.id, v_reg_number, v_program_id, 'Active');
        
    ELSIF v_role_name = 'Faculty' THEN
        INSERT INTO public.faculty_profiles (
            id, 
            employee_id, 
            designation, 
            specialization, 
            office_room, 
            joining_date
        )
        VALUES (
            NEW.id,
            COALESCE(
                NULLIF(NEW.raw_user_meta_data->>'employee_id', ''), 
                'EMP-' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 8))
            ),
            COALESCE(
                NULLIF(NEW.raw_user_meta_data->>'designation', ''), 
                'Lecturer'
            ),
            NEW.raw_user_meta_data->>'specialization',
            NEW.raw_user_meta_data->>'office_room',
            COALESCE(
                NULLIF(NEW.raw_user_meta_data->>'joining_date', '')::date, 
                CURRENT_DATE
            )
        );
    END IF;
    -- Note: Admin, Finance, and Librarian roles only need users + profiles (no extra profile table)

    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- Log the error but don't block user creation
        RAISE WARNING 'handle_new_user error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
