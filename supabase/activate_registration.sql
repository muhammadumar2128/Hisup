-- ==========================================
-- ACTIVATE REGISTRATION: SEMESTERS & SECTIONS
-- ==========================================

-- This script creates an active semester and links courses to it as sections.
-- Students can only see sections that are in an 'is_active' semester.

DO $$
DECLARE
    v_program_id UUID;
    v_semester_id UUID;
    v_course_record RECORD;
BEGIN
    -- 1. Get a sample program ID (e.g., BSCS)
    SELECT id INTO v_program_id FROM public.programs WHERE code = 'BSCS' LIMIT 1;

    -- 2. Create an ACTIVE semester for this program
    INSERT INTO public.semesters (program_id, semester_number, academic_year, term, start_date, end_date, is_active)
    VALUES (
        v_program_id, 
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

    -- 3. Create Sections for all courses in this active semester
    -- We loop through all existing courses and create a 'Section A' for each in our new semester
    FOR v_course_record IN SELECT id, course_code FROM public.courses LOOP
        
        INSERT INTO public.sections (course_id, semester_id, section_name, max_capacity)
        VALUES (v_course_record.id, v_semester_id, 'A', 50)
        ON CONFLICT (course_id, semester_id, section_name) DO NOTHING;

    END LOOP;

    RAISE NOTICE 'Success! Semester activated and sections created for all courses.';
END $$;
