-- =========================================================================
-- MASSIVE DATA SEED SCRIPT (Phase 1) - SELF-HEALING VERSION
-- =========================================================================

-- 0. Ensure the missing table exists
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES public.sections(id) ON DELETE RESTRICT,
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('Present', 'Absent', 'Leave')),
    marked_by UUID REFERENCES public.faculty_profiles(id) ON DELETE SET NULL,
    UNIQUE(section_id, student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    -- Variables for roles
    v_role_student INT := 3;
    v_role_faculty INT := 2;
    v_role_admin INT := 1;
    
    v_campus_id UUID;
    v_cs_dept_id UUID;
    v_bs_cs_prog_id UUID;
    v_sem_4_id UUID;

    i INT;
    j INT;
    k INT;
    
    v_faculty_ids UUID[] := ARRAY[
        uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), 
        uuid_generate_v4(), uuid_generate_v4()
    ];
    
    v_student_ids UUID[];
    v_course_ids UUID[];
    v_section_ids UUID[];
    
    v_temp_id UUID;
    v_temp_str VARCHAR;
    v_comp_id UUID;
BEGIN

    -- 1. BASE SETUP
    SELECT id INTO v_campus_id FROM public.campuses WHERE name = 'Main Campus' LIMIT 1;
    IF v_campus_id IS NULL THEN
        INSERT INTO public.campuses (name, location) VALUES ('Main Campus', 'Taxila') RETURNING id INTO v_campus_id;
    END IF;

    SELECT id INTO v_cs_dept_id FROM public.departments WHERE code = 'CS' LIMIT 1;
    IF v_cs_dept_id IS NULL THEN
        INSERT INTO public.departments (campus_id, name, code) VALUES (v_campus_id, 'Computer Science', 'CS') RETURNING id INTO v_cs_dept_id;
    END IF;

    SELECT id INTO v_bs_cs_prog_id FROM public.programs WHERE code = 'BSCS' LIMIT 1;
    IF v_bs_cs_prog_id IS NULL THEN
        INSERT INTO public.programs (department_id, name, code, degree_level) VALUES (v_cs_dept_id, 'Bachelor of Science in Computer Science', 'BSCS', 'Undergraduate') RETURNING id INTO v_bs_cs_prog_id;
    END IF;

    FOR i IN 1..4 LOOP
        SELECT id INTO v_temp_id FROM public.semesters WHERE program_id = v_bs_cs_prog_id AND semester_number = i LIMIT 1;
        IF v_temp_id IS NULL THEN
            INSERT INTO public.semesters (program_id, semester_number, term, academic_year, start_date, end_date, is_active) 
            VALUES (
                v_bs_cs_prog_id, i, CASE WHEN i%2=1 THEN 'Fall' ELSE 'Spring' END, '2023-2024', 
                CURRENT_DATE - ((5 - i) * 6 || ' months')::interval,
                CURRENT_DATE - ((4 - i) * 6 || ' months')::interval,
                CASE WHEN i=4 THEN TRUE ELSE FALSE END
            ) RETURNING id INTO v_temp_id;
        END IF;
        IF i = 4 THEN v_sem_4_id := v_temp_id; END IF;
    END LOOP;

    -- 2. CREATE FACULTY
    FOR i IN 1..5 LOOP
        v_temp_id := v_faculty_ids[i];
        BEGIN
            INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, confirmation_token, email_change, email_change_token_new, recovery_token)
            VALUES (
                v_temp_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
                'faculty' || i || '@hitecuni.edu.pk', crypt('password123', gen_salt('bf')), now(), 
                '{"provider": "email", "providers": ["email"]}', format('{"first_name":"Fac","last_name":"ulty%s"}', i)::jsonb, 
                false, now(), now(), NULL, NULL, '', '', '', ''
            );
        EXCEPTION WHEN unique_violation THEN
            SELECT id INTO v_temp_id FROM auth.users WHERE email = 'faculty' || i || '@hitecuni.edu.pk' LIMIT 1;
            v_faculty_ids[i] := v_temp_id;
        END;

        INSERT INTO public.users (id, email, role_id, created_at)
        VALUES (v_temp_id, 'faculty' || i || '@hitecuni.edu.pk', v_role_faculty, now())
        ON CONFLICT (id) DO UPDATE SET role_id = v_role_faculty;

        INSERT INTO public.profiles (id, first_name, last_name)
        VALUES (v_temp_id, 'Dr. Faculty', i::text) ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.faculty_profiles (id, employee_id, designation, joining_date)
        VALUES (v_temp_id, 'EMP-F-' || i, 'Assistant Professor', CURRENT_DATE - '2 years'::interval) ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- 3. CREATE COURSES & SECTIONS
    v_course_ids := ARRAY[]::UUID[];
    v_section_ids := ARRAY[]::UUID[];
    FOR i IN 1..10 LOOP
        v_temp_str := 'CSC-' || (300 + i);
        SELECT id INTO v_temp_id FROM public.courses WHERE course_code = v_temp_str LIMIT 1;
        IF v_temp_id IS NULL THEN
            INSERT INTO public.courses (department_id, course_code, title, credit_hours, lecture_hours, lab_hours)
            VALUES (v_cs_dept_id, v_temp_str, 'Advanced Subject ' || i, 3, 3, 0) RETURNING id INTO v_temp_id;
        END IF;
        v_course_ids := array_append(v_course_ids, v_temp_id);

        SELECT id INTO v_comp_id FROM public.sections WHERE course_id = v_temp_id AND semester_id = v_sem_4_id LIMIT 1;
        IF v_comp_id IS NULL THEN
            INSERT INTO public.sections (course_id, semester_id, faculty_id, section_name, max_capacity)
            VALUES (v_temp_id, v_sem_4_id, v_faculty_ids[(i % 5) + 1], 'Section A', 50) RETURNING id INTO v_comp_id;
        END IF;
        v_section_ids := array_append(v_section_ids, v_comp_id);
    END LOOP;

    -- 4. CREATE STUDENTS
    v_student_ids := ARRAY[]::UUID[];
    FOR i IN 1..20 LOOP
        v_temp_id := uuid_generate_v4();
        BEGIN
            INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, confirmation_token, email_change, email_change_token_new, recovery_token)
            VALUES (
                v_temp_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
                'student' || i || '@hitecuni.edu.pk', crypt('password123', gen_salt('bf')), now(), 
                '{"provider": "email", "providers": ["email"]}', format('{"first_name":"Std","last_name":"%s"}', i)::jsonb, 
                false, now(), now(), NULL, NULL, '', '', '', ''
            );
        EXCEPTION WHEN unique_violation THEN
            SELECT id INTO v_temp_id FROM auth.users WHERE email = 'student' || i || '@hitecuni.edu.pk' LIMIT 1;
        END;
        v_student_ids := array_append(v_student_ids, v_temp_id);

        INSERT INTO public.users (id, email, role_id, created_at)
        VALUES (v_temp_id, 'student' || i || '@hitecuni.edu.pk', v_role_student, now())
        ON CONFLICT (id) DO UPDATE SET role_id = v_role_student;

        INSERT INTO public.profiles (id, first_name, last_name)
        VALUES (v_temp_id, 'Student', i::text) ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.student_profiles (id, registration_number, program_id, current_semester_id, enrollment_status)
        VALUES (v_temp_id, '20-CS-' || i, v_bs_cs_prog_id, v_sem_4_id, 'Active') ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- 5. COURSE ENROLLMENTS
    FOR i IN 1..20 LOOP
        FOR j IN 1..5 LOOP
            INSERT INTO public.course_registrations (student_id, section_id, status)
            VALUES (v_student_ids[i], v_section_ids[j], 'Approved') ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- 6. GRADING
    FOR j IN 1..5 LOOP
        SELECT id INTO v_comp_id FROM public.assessment_components WHERE section_id = v_section_ids[j] AND component_name = 'Midterm' LIMIT 1;
        IF v_comp_id IS NULL THEN
            INSERT INTO public.assessment_components (section_id, component_name, max_marks, weightage)
            VALUES (v_section_ids[j], 'Midterm', 100, 30) RETURNING id INTO v_comp_id;
        END IF;

        FOR i IN 1..20 LOOP
            INSERT INTO public.student_marks (assessment_component_id, student_id, obtained_marks)
            VALUES (v_comp_id, v_student_ids[i], floor(random() * 40 + 60)) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- 7. ATTENDANCE
    FOR j IN 1..5 LOOP
        FOR k IN 1..20 LOOP
            FOR i IN 1..3 LOOP
                INSERT INTO public.attendance (section_id, student_id, date, status)
                VALUES (v_section_ids[j], v_student_ids[k], CURRENT_DATE - (i || ' days')::interval, 
                       CASE WHEN random() > 0.1 THEN 'Present' ELSE 'Absent' END)
                ON CONFLICT DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;

    -- 8. FINANCE INVOICES
    FOR i IN 1..20 LOOP
        INSERT INTO public.invoices (student_id, semester_id, total_amount, due_date, status, challan_number)
        VALUES (v_student_ids[i], v_sem_4_id, 120000, CURRENT_DATE + '15 days'::interval, 
                CASE WHEN random() > 0.5 THEN 'Paid' ELSE 'Unpaid' END, 'FEE-24-' || lpad(i::text, 4, '0'))
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- 9. LIBRARY
    FOR i IN 1..10 LOOP
        SELECT id INTO v_temp_id FROM public.books WHERE title = 'Engineering Book ' || i LIMIT 1;
        IF v_temp_id IS NULL THEN
            INSERT INTO public.books (title, isbn, publisher) 
            VALUES ('Engineering Book ' || i, '978-000000000' || i, 'TechPress') RETURNING id INTO v_temp_id;
            FOR j IN 1..3 LOOP
                INSERT INTO public.book_copies (book_id, barcode, status)
                VALUES (v_temp_id, 'LIB-BC-' || i || '-' || j, 'Available') ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;

    FOR i IN 1..10 LOOP
        INSERT INTO public.library_subscriptions (student_id, start_date, end_date, status)
        VALUES (v_student_ids[i], CURRENT_DATE - '5 days'::interval, CURRENT_DATE + '25 days'::interval, 'Active')
        ON CONFLICT (student_id) DO UPDATE SET status = 'Active', end_date = CURRENT_DATE + '25 days'::interval;
        
        INSERT INTO public.invoices (student_id, semester_id, total_amount, due_date, status, challan_number)
        VALUES (v_student_ids[i], v_sem_4_id, 500, CURRENT_DATE, 'Paid', 'LIB-' || floor(random() * 10000)) ON CONFLICT DO NOTHING;
    END LOOP;

END $$;
