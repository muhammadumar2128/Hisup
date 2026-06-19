-- ============================================================
-- FEATURE: Auto-generate Registration Fee Challan on Student Signup
-- + Library Fee = PKR 5,000
--
-- This migration updates the handle_new_user() trigger to:
--   1. Look up the fee from fee_structures for the student's program
--   2. Add PKR 5,000 library fee on top
--   3. Create an invoice (challan) automatically on first signup
--
-- HOW TO RUN: Paste this in the Supabase SQL Editor and click "Run"
-- ============================================================

-- Ensure sequence exists for sequential registration numbers
CREATE SEQUENCE IF NOT EXISTS public.student_reg_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_id INT;
    v_role_name VARCHAR;
    v_program_id UUID;
    v_reg_number VARCHAR;
    v_seq INT;
    v_fee_amount DECIMAL(10,2) := 0;
    v_library_fee DECIMAL(10,2) := 5000.00;
    v_total_fee DECIMAL(10,2) := 0;
    v_challan VARCHAR(50);
    v_semester_id UUID;
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

    -- 4. Insert into public.profiles
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

        -- =====================================================
        -- 6. AUTO-GENERATE REGISTRATION FEE CHALLAN
        -- =====================================================
        
        -- Try to look up fee from fee_structures for the student's program
        IF v_program_id IS NOT NULL THEN
            BEGIN
                SELECT COALESCE(SUM(fs.amount), 0) INTO v_fee_amount
                FROM public.fee_structures fs
                WHERE fs.program_id = v_program_id
                ORDER BY fs.admission_year DESC
                LIMIT 1;
            EXCEPTION WHEN OTHERS THEN
                v_fee_amount := 0;
            END;
        END IF;

        -- If no fee structure found, use a default registration fee
        IF v_fee_amount = 0 OR v_fee_amount IS NULL THEN
            v_fee_amount := 15000.00;
        END IF;

        -- Add library fee (PKR 5,000)
        v_total_fee := v_fee_amount + v_library_fee;

        -- Generate unique challan number: REG-{timestamp}-{user_id_prefix}
        v_challan := 'REG-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 4);

        -- Try to get the student's current semester (may be NULL for new students)
        BEGIN
            SELECT current_semester_id INTO v_semester_id 
            FROM public.student_profiles 
            WHERE id = NEW.id;
        EXCEPTION WHEN OTHERS THEN
            v_semester_id := NULL;
        END;

        -- Create the registration fee invoice
        INSERT INTO public.invoices (student_id, semester_id, total_amount, due_date, status, challan_number)
        VALUES (
            NEW.id,
            v_semester_id,
            v_total_fee,
            CURRENT_DATE + INTERVAL '30 days',
            'Unpaid',
            v_challan
        );
        
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
