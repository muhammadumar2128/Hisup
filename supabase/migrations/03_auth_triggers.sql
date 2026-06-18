-- PHASE 4: AUTHENTICATION SYNC LOGIC

-- This function will run every time a new user signs up via Supabase Auth
-- It automatically creates a record in our public.users and public.profiles tables.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_id INT;
    v_role_name TEXT;
BEGIN
    -- 1. Determine the role (default to 'Student' if not provided or invalid)
    v_role_name := COALESCE(NEW.raw_user_meta_data->>'role', 'Student');
    SELECT id INTO v_role_id FROM public.roles WHERE role_name = v_role_name;
    
    IF v_role_id IS NULL THEN
        SELECT id INTO v_role_id FROM public.roles WHERE role_name = 'Student';
    END IF;

    -- 2. Insert into our public.users table
    INSERT INTO public.users (id, email, role_id, status)
    VALUES (NEW.id, NEW.email, v_role_id, 'Active')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Insert into our public.profiles table
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
    )
    ON CONFLICT (id) DO NOTHING;

    -- 4. If it's a student and program_id is provided, create a student profile
    IF v_role_name = 'Student' AND (NEW.raw_user_meta_data->>'program_id') IS NOT NULL AND (NEW.raw_user_meta_data->>'program_id') <> '' THEN
        INSERT INTO public.student_profiles (id, registration_number, program_id, enrollment_status)
        VALUES (
            NEW.id,
            'REG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
            (NEW.raw_user_meta_data->>'program_id')::uuid,
            'Active'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 5. If it's faculty and employee_id is provided, create a faculty profile
    IF v_role_name = 'Faculty' AND (NEW.raw_user_meta_data->>'employee_id') IS NOT NULL THEN
        INSERT INTO public.faculty_profiles (id, employee_id, designation, joining_date)
        VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'employee_id',
            COALESCE(NEW.raw_user_meta_data->>'designation', 'Lecturer'),
            CURRENT_DATE
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
