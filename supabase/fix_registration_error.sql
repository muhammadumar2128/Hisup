-- RESILIENT AUTH TRIGGER FIX
-- This script updates the handle_new_user function to be more error-proof
-- and increases the length of some fields to prevent truncation errors.

-- 1. Increase field lengths to prevent "value too long" errors
ALTER TABLE public.profiles ALTER COLUMN cnic TYPE VARCHAR(30);
ALTER TABLE public.profiles ALTER COLUMN phone TYPE VARCHAR(30);

-- 2. Update the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_id INT;
    v_role_name TEXT;
BEGIN
    -- 1. Determine the role (default to 'Student')
    v_role_name := COALESCE(NEW.raw_user_meta_data->>'role', 'Student');
    SELECT id INTO v_role_id FROM public.roles WHERE role_name = v_role_name;
    
    IF v_role_id IS NULL THEN
        SELECT id INTO v_role_id FROM public.roles WHERE role_name = 'Student';
    END IF;

    -- 2. Insert into our public.users table (using UPSERT to handle stale records)
    INSERT INTO public.users (id, email, role_id, status)
    VALUES (NEW.id, NEW.email, v_role_id, 'Active')
    ON CONFLICT (id) DO UPDATE SET 
        email = EXCLUDED.email,
        role_id = EXCLUDED.role_id;

    -- 3. Insert into our public.profiles table
    -- Using NULLIF and COALESCE to ensure NO NULLs in required fields
    -- and using UPSERT to avoid crashes on retries
    INSERT INTO public.profiles (id, first_name, last_name, phone, cnic, gender, dob, current_address, permanent_address)
    VALUES (
        NEW.id, 
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'New'), 
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'User'),
        NEW.raw_user_meta_data->>'phone',
        NULLIF(NEW.raw_user_meta_data->>'cnic', ''),
        CASE 
            WHEN (NEW.raw_user_meta_data->>'gender') IN ('Male', 'Female', 'Other') THEN NEW.raw_user_meta_data->>'gender'
            ELSE 'Other'
        END,
        CASE 
            WHEN (NEW.raw_user_meta_data->>'dob') IS NOT NULL AND (NEW.raw_user_meta_data->>'dob') <> '' 
            THEN (NEW.raw_user_meta_data->>'dob')::date 
            ELSE NULL 
        END,
        NEW.raw_user_meta_data->>'current_address',
        NEW.raw_user_meta_data->>'permanent_address'
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        cnic = EXCLUDED.cnic,
        gender = EXCLUDED.gender,
        dob = EXCLUDED.dob;

    -- 4. Student Profile Creation
    IF v_role_name = 'Student' THEN
        -- We only attempt this if a program_id is provided
        IF (NEW.raw_user_meta_data->>'program_id') IS NOT NULL AND (NEW.raw_user_meta_data->>'program_id') <> '' THEN
            BEGIN
                INSERT INTO public.student_profiles (id, registration_number, program_id, enrollment_status)
                VALUES (
                    NEW.id,
                    'REG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
                    (NEW.raw_user_meta_data->>'program_id')::uuid,
                    'Active'
                )
                ON CONFLICT (id) DO NOTHING;
            EXCEPTION WHEN OTHERS THEN
                -- If it fails (e.g. invalid UUID), we don't crash the whole signup
                RAISE WARNING 'Could not create student profile: %', SQLERRM;
            END;
        END IF;
    END IF;

    -- 5. Faculty Profile Creation
    IF v_role_name = 'Faculty' THEN
        IF (NEW.raw_user_meta_data->>'employee_id') IS NOT NULL THEN
            INSERT INTO public.faculty_profiles (id, employee_id, designation, joining_date)
            VALUES (
                NEW.id,
                NEW.raw_user_meta_data->>'employee_id',
                COALESCE(NEW.raw_user_meta_data->>'designation', 'Lecturer'),
                CURRENT_DATE
            )
            ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
