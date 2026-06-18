-- ======================================================================================
-- MIGRATION: ADD ON UPDATE CASCADE TO ALL FOREIGN KEYS
-- Run this in your Supabase SQL Editor to make the live site match the Final Schema
-- ======================================================================================

-- 1. USERS & PROFILES
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE public.users ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. ACADEMIC STRUCTURE
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_campus_id_fkey;
ALTER TABLE public.departments ADD CONSTRAINT departments_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_department_id_fkey;
ALTER TABLE public.programs ADD CONSTRAINT programs_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.semesters DROP CONSTRAINT IF EXISTS semesters_program_id_fkey;
ALTER TABLE public.semesters ADD CONSTRAINT semesters_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. COURSES & SECTIONS
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_department_id_fkey;
ALTER TABLE public.courses ADD CONSTRAINT courses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.course_prerequisites DROP CONSTRAINT IF EXISTS course_prerequisites_course_id_fkey;
ALTER TABLE public.course_prerequisites ADD CONSTRAINT course_prerequisites_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.course_prerequisites DROP CONSTRAINT IF EXISTS course_prerequisites_prerequisite_course_id_fkey;
ALTER TABLE public.course_prerequisites ADD CONSTRAINT course_prerequisites_prerequisite_course_id_fkey FOREIGN KEY (prerequisite_course_id) REFERENCES public.courses(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_campus_id_fkey;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_course_id_fkey;
ALTER TABLE public.sections ADD CONSTRAINT sections_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_semester_id_fkey;
ALTER TABLE public.sections ADD CONSTRAINT sections_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_faculty_id_fkey;
ALTER TABLE public.sections ADD CONSTRAINT sections_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculty_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. STUDENT & FACULTY PROFILES
ALTER TABLE public.student_profiles DROP CONSTRAINT IF EXISTS student_profiles_id_fkey;
ALTER TABLE public.student_profiles ADD CONSTRAINT student_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.student_profiles DROP CONSTRAINT IF EXISTS student_profiles_program_id_fkey;
ALTER TABLE public.student_profiles ADD CONSTRAINT student_profiles_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.student_profiles DROP CONSTRAINT IF EXISTS student_profiles_current_semester_id_fkey;
ALTER TABLE public.student_profiles ADD CONSTRAINT student_profiles_current_semester_id_fkey FOREIGN KEY (current_semester_id) REFERENCES public.semesters(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public.faculty_profiles DROP CONSTRAINT IF EXISTS faculty_profiles_id_fkey;
ALTER TABLE public.faculty_profiles ADD CONSTRAINT faculty_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. ATTENDANCE & GRADES
ALTER TABLE public.class_schedule DROP CONSTRAINT IF EXISTS class_schedule_section_id_fkey;
ALTER TABLE public.class_schedule ADD CONSTRAINT class_schedule_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.class_schedule DROP CONSTRAINT IF EXISTS class_schedule_room_id_fkey;
ALTER TABLE public.class_schedule ADD CONSTRAINT class_schedule_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.course_registrations DROP CONSTRAINT IF EXISTS course_registrations_student_id_fkey;
ALTER TABLE public.course_registrations ADD CONSTRAINT course_registrations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.course_registrations DROP CONSTRAINT IF EXISTS course_registrations_section_id_fkey;
ALTER TABLE public.course_registrations ADD CONSTRAINT course_registrations_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_section_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_marked_by_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.faculty_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public.assessment_components DROP CONSTRAINT IF EXISTS assessment_components_section_id_fkey;
ALTER TABLE public.assessment_components ADD CONSTRAINT assessment_components_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.student_marks DROP CONSTRAINT IF EXISTS student_marks_assessment_component_id_fkey;
ALTER TABLE public.student_marks ADD CONSTRAINT student_marks_assessment_component_id_fkey FOREIGN KEY (assessment_component_id) REFERENCES public.assessment_components(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.student_marks DROP CONSTRAINT IF EXISTS student_marks_student_id_fkey;
ALTER TABLE public.student_marks ADD CONSTRAINT student_marks_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.semester_results DROP CONSTRAINT IF EXISTS semester_results_student_id_fkey;
ALTER TABLE public.semester_results ADD CONSTRAINT semester_results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.semester_results DROP CONSTRAINT IF EXISTS semester_results_semester_id_fkey;
ALTER TABLE public.semester_results ADD CONSTRAINT semester_results_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. FINANCE
ALTER TABLE public.fee_structures DROP CONSTRAINT IF EXISTS fee_structures_program_id_fkey;
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.fee_structures DROP CONSTRAINT IF EXISTS fee_structures_fee_head_id_fkey;
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_fee_head_id_fkey FOREIGN KEY (fee_head_id) REFERENCES public.fee_heads(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_student_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_semester_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. LIBRARY
ALTER TABLE public.book_copies DROP CONSTRAINT IF EXISTS book_copies_book_id_fkey;
ALTER TABLE public.book_copies ADD CONSTRAINT book_copies_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.library_subscriptions DROP CONSTRAINT IF EXISTS library_subscriptions_student_id_fkey;
ALTER TABLE public.library_subscriptions ADD CONSTRAINT library_subscriptions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.library_transactions DROP CONSTRAINT IF EXISTS library_transactions_user_id_fkey;
ALTER TABLE public.library_transactions ADD CONSTRAINT library_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.library_transactions DROP CONSTRAINT IF EXISTS library_transactions_copy_id_fkey;
ALTER TABLE public.library_transactions ADD CONSTRAINT library_transactions_copy_id_fkey FOREIGN KEY (copy_id) REFERENCES public.book_copies(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.library_fines DROP CONSTRAINT IF EXISTS library_fines_transaction_id_fkey;
ALTER TABLE public.library_fines ADD CONSTRAINT library_fines_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.library_transactions(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.library_fines DROP CONSTRAINT IF EXISTS library_fines_payment_id_fkey;
ALTER TABLE public.library_fines ADD CONSTRAINT library_fines_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL ON UPDATE CASCADE;
