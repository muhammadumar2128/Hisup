-- GLOBAL SEMESTER & COURSE ACTIVATION
-- This script creates active semesters for all programs and links the new realistic courses to them.

DO $$
DECLARE
    v_prog_record RECORD;
    v_course_record RECORD;
    v_semester_id UUID;
BEGIN
    -- 1. Create/Activate a Fall 2026 semester for EVERY program
    FOR v_prog_record IN SELECT id, name FROM public.programs LOOP
        
        INSERT INTO public.semesters (program_id, semester_number, academic_year, term, start_date, end_date, is_active)
        VALUES (
            v_prog_record.id, 
            1, 
            '2026', 
            'Fall', 
            '2026-09-01', 
            '2027-01-30', 
            true
        )
        ON CONFLICT (program_id, semester_number, academic_year, term) 
        DO UPDATE SET is_active = true
        RETURNING id INTO v_semester_id;

        -- 2. Link relevant courses to this semester as sections
        -- For CS/SE programs, we link CS/SE courses
        -- For EE, we link EE courses, etc.
        FOR v_course_record IN 
            SELECT id, course_code, department_id FROM public.courses 
            WHERE department_id = (SELECT department_id FROM public.programs WHERE id = v_prog_record.id)
        LOOP
            INSERT INTO public.sections (course_id, semester_id, section_name, max_capacity)
            VALUES (v_course_record.id, v_semester_id, 'Section A', 50)
            ON CONFLICT (course_id, semester_id, section_name) DO NOTHING;
        END LOOP;

    END LOOP;

    RAISE NOTICE 'Success! All programs now have an active semester with realistic courses.';
END $$;
