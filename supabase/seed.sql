-- HiSUP Initial Seed Data

-- 1. Insert Campuses
INSERT INTO public.campuses (name, location) VALUES 
('Main Campus', 'Taxila, Cantt'),
('City Campus', 'Islamabad, Sector H-11');

-- 2. Insert Departments (Assuming UUIDs are generated, we use a subquery to link to campuses)
INSERT INTO public.departments (campus_id, name, code) 
SELECT id, 'Computer Science', 'CS' FROM public.campuses WHERE name = 'Main Campus';

INSERT INTO public.departments (campus_id, name, code) 
SELECT id, 'Electrical Engineering', 'EE' FROM public.campuses WHERE name = 'Main Campus';

INSERT INTO public.departments (campus_id, name, code) 
SELECT id, 'Management Sciences', 'MS' FROM public.campuses WHERE name = 'City Campus';

-- 3. Insert Programs
INSERT INTO public.programs (department_id, name, code, total_credit_hours, duration_years)
SELECT id, 'BS Computer Science', 'BSCS', 130, 4.0 FROM public.departments WHERE code = 'CS';

INSERT INTO public.programs (department_id, name, code, total_credit_hours, duration_years)
SELECT id, 'BS Software Engineering', 'BSSE', 132, 4.0 FROM public.departments WHERE code = 'CS';

-- 4. Insert Fee Heads
INSERT INTO public.fee_heads (name, description) VALUES 
('Tuition Fee', 'Main semester academic fee'),
('Registration Fee', 'One-time admission registration fee'),
('Library Security', 'Refundable library security deposit'),
('Exam Fee', 'End-term examination processing fee');

-- 5. Insert Sample Courses
INSERT INTO public.courses (department_id, course_code, title, credit_hours, lecture_hours, lab_hours, description)
SELECT id, 'CS-101', 'Introduction to Computing', 3, 3, 0, 'Fundamental concepts of computer science.' FROM public.departments WHERE code = 'CS';

INSERT INTO public.courses (department_id, course_code, title, credit_hours, lecture_hours, lab_hours, description)
SELECT id, 'CS-201', 'Data Structures & Algorithms', 4, 3, 3, 'Advanced data organization and processing.' FROM public.departments WHERE code = 'CS';
