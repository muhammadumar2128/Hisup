-- REALISTIC COURSE SEEDING SCRIPT
-- This script removes placeholder "Advanced" courses and adds real academic courses
-- for CS, SE, EE, and ME programs.

DO $$
DECLARE
    v_cs_dept_id UUID;
    v_ee_dept_id UUID;
    v_me_dept_id UUID;
BEGIN
    -- 1. Get Department IDs
    SELECT id INTO v_cs_dept_id FROM public.departments WHERE code = 'CS' LIMIT 1;
    SELECT id INTO v_ee_dept_id FROM public.departments WHERE code = 'EE' LIMIT 1;
    SELECT id INTO v_me_dept_id FROM public.departments WHERE code = 'ME' LIMIT 1;

    -- If ME dept doesn't exist by code, try by name
    IF v_me_dept_id IS NULL THEN
        SELECT id INTO v_me_dept_id FROM public.departments WHERE name ILIKE '%Mechanical%' LIMIT 1;
    END IF;

    -- 2. Cleanup placeholder courses AND their dependencies
    -- We must delete from the bottom up to avoid FK violations
    DELETE FROM public.student_marks WHERE assessment_component_id IN (
        SELECT id FROM public.assessment_components WHERE section_id IN (
            SELECT id FROM public.sections WHERE course_id IN (
                SELECT id FROM public.courses WHERE title LIKE 'Advanced Subject%'
            )
        )
    );

    DELETE FROM public.assessment_components WHERE section_id IN (
        SELECT id FROM public.sections WHERE course_id IN (
            SELECT id FROM public.courses WHERE title LIKE 'Advanced Subject%'
        )
    );

    DELETE FROM public.attendance WHERE section_id IN (
        SELECT id FROM public.sections WHERE course_id IN (
            SELECT id FROM public.courses WHERE title LIKE 'Advanced Subject%'
        )
    );

    DELETE FROM public.course_registrations WHERE section_id IN (
        SELECT id FROM public.sections WHERE course_id IN (
            SELECT id FROM public.courses WHERE title LIKE 'Advanced Subject%'
        )
    );

    DELETE FROM public.sections WHERE course_id IN (
        SELECT id FROM public.courses WHERE title LIKE 'Advanced Subject%'
    );

    DELETE FROM public.courses WHERE title LIKE 'Advanced Subject%';

    -- 3. Seed Computer Science & Software Engineering Courses
    INSERT INTO public.courses (department_id, course_code, title, credit_hours, lecture_hours, lab_hours, description)
    VALUES 
    (v_cs_dept_id, 'CS-101', 'Programming Fundamentals', 4, 3, 3, 'Introduction to structured programming using C++/Python.'),
    (v_cs_dept_id, 'CS-201', 'Object Oriented Programming', 4, 3, 3, 'Principles of OOP, classes, inheritance, and polymorphism.'),
    (v_cs_dept_id, 'CS-210', 'Data Structures & Algorithms', 4, 3, 3, 'Stacks, queues, trees, graphs, and algorithm complexity.'),
    (v_cs_dept_id, 'CS-302', 'Database Systems', 4, 3, 3, 'Relational databases, SQL, normalization, and indexing.'),
    (v_cs_dept_id, 'CS-305', 'Operating Systems', 4, 3, 3, 'Process management, memory, and file systems.'),
    (v_cs_dept_id, 'CS-401', 'Artificial Intelligence', 3, 3, 0, 'Search techniques, knowledge representation, and machine learning.'),
    (v_cs_dept_id, 'SE-301', 'Software Engineering', 3, 3, 0, 'Software development lifecycles, requirements, and design.'),
    (v_cs_dept_id, 'SE-402', 'Software Quality Assurance', 3, 3, 0, 'Testing methodologies, standards, and quality metrics.'),
    (v_cs_dept_id, 'CS-311', 'Computer Networks', 4, 3, 3, 'Network protocols, OSI model, and socket programming.'),
    (v_cs_dept_id, 'CS-100', 'Calculus & Analytical Geometry', 3, 3, 0, 'Limits, derivatives, and integral calculus.')
    ON CONFLICT (course_code) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description;

    -- 4. Seed Electrical Engineering Courses
    IF v_ee_dept_id IS NOT NULL THEN
        INSERT INTO public.courses (department_id, course_code, title, credit_hours, lecture_hours, lab_hours, description)
        VALUES 
        (v_ee_dept_id, 'EE-101', 'Linear Circuit Analysis', 4, 3, 3, 'Basic circuit laws, theorems, and DC/AC analysis.'),
        (v_ee_dept_id, 'EE-201', 'Digital Logic Design', 4, 3, 3, 'Boolean algebra, combinational and sequential circuits.'),
        (v_ee_dept_id, 'EE-210', 'Electronic Devices & Circuits', 4, 3, 3, 'Semiconductors, diodes, BJT, and FET applications.'),
        (v_ee_dept_id, 'EE-302', 'Signals & Systems', 3, 3, 0, 'Continuous and discrete time signals, Fourier transform.'),
        (v_ee_dept_id, 'EE-405', 'Control Systems', 4, 3, 3, 'Feedback control, stability analysis, and PID controllers.')
        ON CONFLICT (course_code) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description;
    END IF;

    -- 5. Seed Mechanical Engineering Courses
    IF v_me_dept_id IS NOT NULL THEN
        INSERT INTO public.courses (department_id, course_code, title, credit_hours, lecture_hours, lab_hours, description)
        VALUES 
        (v_me_dept_id, 'ME-101', 'Engineering Statics', 3, 3, 0, 'Force systems, equilibrium, and structural analysis.'),
        (v_me_dept_id, 'ME-201', 'Thermodynamics I', 3, 3, 0, 'First and second laws of thermodynamics, energy analysis.'),
        (v_me_dept_id, 'ME-205', 'Fluid Mechanics', 4, 3, 3, 'Fluid properties, statics, and dynamics of flow.'),
        (v_me_dept_id, 'ME-302', 'Mechanics of Materials', 4, 3, 3, 'Stress, strain, and deformation of solids.'),
        (v_me_dept_id, 'ME-401', 'Heat & Mass Transfer', 4, 3, 3, 'Conduction, convection, and radiation principles.')
        ON CONFLICT (course_code) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description;
    END IF;

    RAISE NOTICE 'Realistic courses seeded successfully.';
END $$;
