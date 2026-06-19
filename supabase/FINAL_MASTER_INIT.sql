-- PHASE 1: DATABASE SCHEMA DESIGN

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Module 1: Core & Identity Management
-- ==========================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default roles
INSERT INTO roles (role_name) VALUES ('Admin'), ('Faculty'), ('Student'), ('Librarian'), ('Finance');

CREATE TABLE users (
    id UUID PRIMARY KEY, -- matches auth.users in Supabase
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id INT REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended'))
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    cnic VARCHAR(15) UNIQUE,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    dob DATE,
    current_address TEXT,
    permanent_address TEXT
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    row_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Module 2: Academic Structure
-- ==========================================

CREATE TABLE campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    location TEXT NOT NULL
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID REFERENCES campuses(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    total_credit_hours INT NOT NULL,
    duration_years DECIMAL(3, 1) NOT NULL
);

CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE RESTRICT,
    semester_number INT NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    term VARCHAR(10) CHECK (term IN ('Fall', 'Spring', 'Summer')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    UNIQUE (program_id, semester_number, academic_year, term)
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    credit_hours INT NOT NULL,
    lecture_hours INT NOT NULL,
    lab_hours INT NOT NULL,
    description TEXT
);

CREATE TABLE course_prerequisites (
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite_course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, prerequisite_course_id)
);

-- ==========================================
-- Module 3: Student & Faculty Records
-- ==========================================

CREATE TABLE student_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    program_id UUID REFERENCES programs(id) ON DELETE RESTRICT,
    current_semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    enrollment_status VARCHAR(20) DEFAULT 'Active' CHECK (enrollment_status IN ('Active', 'Suspended', 'Graduated'))
);

CREATE TABLE faculty_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    designation VARCHAR(100) NOT NULL,
    specialization VARCHAR(150),
    office_room VARCHAR(50),
    joining_date DATE NOT NULL
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID REFERENCES campuses(id) ON DELETE RESTRICT,
    room_number VARCHAR(50) NOT NULL,
    building VARCHAR(100),
    capacity INT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Lecture', 'Lab', 'Office')),
    UNIQUE(campus_id, room_number, building)
);

-- ==========================================
-- Module 4: Course Registration & Scheduling
-- ==========================================

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
    semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT,
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
    section_name VARCHAR(10) NOT NULL,
    max_capacity INT NOT NULL,
    UNIQUE(course_id, semester_id, section_name)
);

CREATE TABLE class_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE RESTRICT,
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE course_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE RESTRICT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Dropped')),
    UNIQUE(student_id, section_id)
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE RESTRICT,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('Present', 'Absent', 'Leave')),
    marked_by UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
    UNIQUE(section_id, student_id, date)
);

-- ==========================================
-- Module 5: Grading & Result Management
-- ==========================================

CREATE TABLE assessment_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    component_name VARCHAR(50) CHECK (component_name IN ('Quiz', 'Assignment', 'Midterm', 'Final', 'Project')),
    weightage DECIMAL(5, 2) NOT NULL,
    max_marks DECIMAL(5, 2) NOT NULL
);

CREATE TABLE student_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_component_id UUID REFERENCES assessment_components(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    obtained_marks DECIMAL(5, 2) NOT NULL,
    remarks TEXT,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_component_id, student_id)
);

CREATE TABLE semester_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT,
    sgpa DECIMAL(4, 3),
    cgpa DECIMAL(4, 3),
    total_credits_earned INT,
    status VARCHAR(20) CHECK (status IN ('Promoted', 'Probation', 'Warning')),
    UNIQUE(student_id, semester_id)
);

-- ==========================================
-- Module 6: Fee & Financial Processing
-- ==========================================

CREATE TABLE fee_heads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    admission_year VARCHAR(10) NOT NULL,
    fee_head_id UUID REFERENCES fee_heads(id) ON DELETE RESTRICT,
    amount DECIMAL(10, 2) NOT NULL,
    UNIQUE(program_id, admission_year, fee_head_id)
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT,
    total_amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid', 'Partial', 'Overdue')),
    challan_number VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(20) CHECK (payment_method IN ('Bank', 'Easypaisa', 'JazzCash', 'Card')),
    transaction_reference VARCHAR(100) UNIQUE NOT NULL
);

-- ==========================================
-- Module 7: Library Services
-- ==========================================

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    publisher VARCHAR(150),
    publication_year INT,
    category VARCHAR(100)
);

CREATE TABLE book_copies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Issued', 'Reserved', 'Damaged')),
    shelf_location VARCHAR(100)
);

CREATE TABLE library_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    copy_id UUID REFERENCES book_copies(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'Issued' CHECK (status IN ('Issued', 'Returned', 'Overdue'))
);

CREATE TABLE library_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    UNIQUE(student_id)
);

CREATE TABLE library_fines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES library_transactions(id) ON DELETE CASCADE,
    fine_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid')),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL
);

-- Create some indexes for foreign keys to optimize joins and ON DELETE RESTRICT
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_departments_campus_id ON departments(campus_id);
CREATE INDEX idx_programs_department_id ON programs(department_id);
CREATE INDEX idx_semesters_program_id ON semesters(program_id);
CREATE INDEX idx_courses_department_id ON courses(department_id);
CREATE INDEX idx_sections_course_id ON sections(course_id);
CREATE INDEX idx_sections_semester_id ON sections(semester_id);
CREATE INDEX idx_sections_faculty_id ON sections(faculty_id);
CREATE INDEX idx_class_schedule_section_id ON class_schedule(section_id);
CREATE INDEX idx_course_registrations_student_id ON course_registrations(student_id);
CREATE INDEX idx_course_registrations_section_id ON course_registrations(section_id);
CREATE INDEX idx_attendance_section_id ON attendance(section_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_student_marks_student_id ON student_marks(student_id);
CREATE INDEX idx_invoices_student_id ON invoices(student_id);
CREATE INDEX idx_library_transactions_copy_id ON library_transactions(copy_id);
CREATE INDEX idx_library_transactions_user_id ON library_transactions(user_id);
-- PHASE 2: ADVANCED DATABASE LOGIC (PL/pgSQL & SECURITY)

-- ==========================================
-- 1. UTILITY PROCEDURES
-- ==========================================

-- Procedure for logging errors (Demonstrating usage of PROCEDURE and EXCEPTION)
CREATE OR REPLACE PROCEDURE log_system_error(p_context VARCHAR, p_error_message VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE WARNING 'System Error in [%]: %', p_context, p_error_message;
    -- In a real-world scenario, you might insert this into a dedicated error_logs table.
EXCEPTION 
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to log error: %', SQLERRM;
END;
$$;

-- Procedure to update book copy status
CREATE OR REPLACE PROCEDURE update_book_copy_status_proc(p_copy_id UUID, p_status VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE book_copies SET status = p_status WHERE id = p_copy_id;
EXCEPTION 
    WHEN OTHERS THEN
        CALL log_system_error('update_book_copy_status_proc', SQLERRM);
END;
$$;

-- ==========================================
-- 2. AUTOMATION TRIGGERS (WITH EXCEPTION HANDLING)
-- ==========================================

-- Trigger Function: Audit Logging
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Attempt to get the current user ID securely.
    BEGIN
        current_user_id := auth.uid();
    EXCEPTION 
        WHEN OTHERS THEN
            current_user_id := NULL;
    END;

    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (user_id, action, table_name, row_id, old_values, new_values)
        VALUES (current_user_id, 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (user_id, action, table_name, row_id, old_values)
        VALUES (current_user_id, 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
EXCEPTION 
    WHEN OTHERS THEN
        CALL log_system_error('log_audit_action', SQLERRM);
        RETURN NULL; -- Don't block the actual operation if auditing fails
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_student_profiles
AFTER UPDATE OR DELETE ON student_profiles
FOR EACH ROW EXECUTE PROCEDURE log_audit_action();

CREATE TRIGGER trg_audit_student_marks
AFTER UPDATE OR DELETE ON student_marks
FOR EACH ROW EXECUTE PROCEDURE log_audit_action();

CREATE TRIGGER trg_audit_payments
AFTER UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE PROCEDURE log_audit_action();

-- Trigger Function: Generate Invoice on Registration Approval
CREATE OR REPLACE FUNCTION generate_invoice_on_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_fee_amount DECIMAL(10,2) := 0;
    v_semester_id UUID;
    v_program_id UUID;
    v_challan VARCHAR(50);
BEGIN
    IF (NEW.status = 'Approved' AND (OLD.status IS DISTINCT FROM 'Approved' OR TG_OP = 'INSERT')) THEN
        BEGIN
            -- Retrieve student program and semester
            SELECT program_id, current_semester_id 
            INTO v_program_id, v_semester_id
            FROM student_profiles 
            WHERE id = NEW.student_id;
            
            -- Attempt to get the latest fee structure for the program
            BEGIN
                SELECT amount INTO v_fee_amount
                FROM fee_structures
                WHERE program_id = v_program_id 
                ORDER BY admission_year DESC LIMIT 1;
                
                IF v_fee_amount IS NULL THEN v_fee_amount := 15000.00; END IF; -- Default fallback
            EXCEPTION 
                WHEN NO_DATA_FOUND THEN
                    v_fee_amount := 15000.00;
            END;

            -- Generate unique challan number
            v_challan := 'CHL-' || extract(epoch from now())::int || '-' || substring(NEW.student_id::text from 1 for 4);

            INSERT INTO invoices (student_id, semester_id, total_amount, due_date, status, challan_number)
            VALUES (NEW.student_id, v_semester_id, v_fee_amount, CURRENT_DATE + INTERVAL '15 days', 'Unpaid', v_challan);
            
        EXCEPTION 
            WHEN unique_violation THEN
                CALL log_system_error('generate_invoice_on_approval', 'Invoice already generated or challan conflict: ' || SQLERRM);
            WHEN OTHERS THEN
                CALL log_system_error('generate_invoice_on_approval', SQLERRM);
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_invoice
AFTER INSERT OR UPDATE ON course_registrations
FOR EACH ROW EXECUTE PROCEDURE generate_invoice_on_approval();

-- Trigger Function: Update Book Status automatically
CREATE OR REPLACE FUNCTION update_book_copy_status()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
            IF NEW.status = 'Issued' THEN
                CALL update_book_copy_status_proc(NEW.copy_id, 'Issued');
            ELSIF NEW.status = 'Returned' THEN
                CALL update_book_copy_status_proc(NEW.copy_id, 'Available');
            END IF;
        END IF;
    EXCEPTION 
        WHEN OTHERS THEN
            CALL log_system_error('update_book_copy_status trigger', SQLERRM);
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_book_status
AFTER INSERT OR UPDATE ON library_transactions
FOR EACH ROW EXECUTE PROCEDURE update_book_copy_status();


-- ==========================================
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Helper function to get current user role securely
CREATE OR REPLACE FUNCTION get_current_user_role() 
RETURNS VARCHAR AS $$
DECLARE
    v_role_name VARCHAR;
BEGIN
    SELECT r.role_name INTO v_role_name
    FROM users u 
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();
    
    RETURN v_role_name;
EXCEPTION 
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on core tables
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_copies ENABLE ROW LEVEL SECURITY;

-- student_profiles Policies
CREATE POLICY student_profiles_read_own ON student_profiles
    FOR SELECT USING (id = auth.uid() OR get_current_user_role() IN ('Admin', 'Faculty', 'Finance', 'Librarian'));
CREATE POLICY student_profiles_admin_all ON student_profiles
    FOR ALL USING (get_current_user_role() = 'Admin');

-- course_registrations Policies
CREATE POLICY course_registrations_read_own ON course_registrations
    FOR SELECT USING (student_id = auth.uid() OR get_current_user_role() IN ('Admin', 'Faculty'));
CREATE POLICY course_registrations_admin_all ON course_registrations
    FOR ALL USING (get_current_user_role() = 'Admin');

-- attendance Policies
CREATE POLICY attendance_read_own ON attendance
    FOR SELECT USING (student_id = auth.uid());
CREATE POLICY attendance_faculty_manage ON attendance
    FOR ALL USING (
        get_current_user_role() = 'Faculty' AND 
        section_id IN (SELECT id FROM sections WHERE faculty_id = auth.uid())
    );
CREATE POLICY attendance_admin_all ON attendance
    FOR ALL USING (get_current_user_role() = 'Admin');

-- student_marks Policies
CREATE POLICY student_marks_read_own ON student_marks
    FOR SELECT USING (student_id = auth.uid());
CREATE POLICY student_marks_faculty_manage ON student_marks
    FOR ALL USING (
        get_current_user_role() = 'Faculty' AND 
        assessment_component_id IN (
            SELECT id FROM assessment_components 
            WHERE section_id IN (SELECT id FROM sections WHERE faculty_id = auth.uid())
        )
    );
CREATE POLICY student_marks_admin_all ON student_marks
    FOR ALL USING (get_current_user_role() = 'Admin');

-- invoices & payments Policies
CREATE POLICY invoices_read_own ON invoices
    FOR SELECT USING (student_id = auth.uid());
CREATE POLICY invoices_finance_all ON invoices
    FOR ALL USING (get_current_user_role() IN ('Finance', 'Admin'));

CREATE POLICY payments_read_own ON payments
    FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE student_id = auth.uid()));
CREATE POLICY payments_finance_all ON payments
    FOR ALL USING (get_current_user_role() IN ('Finance', 'Admin'));

-- library_transactions Policies
CREATE POLICY lib_trans_read_own ON library_transactions
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY lib_trans_librarian_all ON library_transactions
    FOR ALL USING (get_current_user_role() IN ('Librarian', 'Admin'));

-- books & book_copies Policies
CREATE POLICY books_read_all ON books 
    FOR SELECT USING (true);
CREATE POLICY books_librarian_all ON books 
    FOR ALL USING (get_current_user_role() IN ('Librarian', 'Admin'));

CREATE POLICY book_copies_read_all ON book_copies 
    FOR SELECT USING (true);
CREATE POLICY book_copies_librarian_all ON book_copies 
    FOR ALL USING (get_current_user_role() IN ('Librarian', 'Admin'));
-- PHASE 4: AUTHENTICATION SYNC LOGIC

-- This function will run every time a new user signs up via Supabase Auth
-- It automatically creates a record in our public.users and public.profiles tables.

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
        
        DECLARE
            v_fee_amount DECIMAL(10,2) := 0;
            v_library_fee DECIMAL(10,2) := 5000.00;
            v_total_fee DECIMAL(10,2) := 0;
            v_challan VARCHAR(50);
            v_semester_id UUID;
        BEGIN
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
        END;
        
    ELSIF v_role_name = 'Faculty' THEN
        INSERT INTO public.faculty_profiles (id, employee_id, designation, specialization, office_room, joining_date)
        VALUES (
            NEW.id,
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'employee_id', ''), 'EMP-' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 8))),
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'designation', ''), 'Lecturer'),
            NEW.raw_user_meta_data->>'specialization',
            NEW.raw_user_meta_data->>'office_room',
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'joining_date', '')::date, CURRENT_DATE)
        );
    END IF;

    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- ==========================================
-- MASSIVE SEED SCRIPT: CS COURSE CATALOG
-- ==========================================

-- This script inserts the full 4-year Computer Science curriculum into your live database.
-- Run this in your Supabase SQL Editor.

DO $$
DECLARE
    v_dept_id UUID;
BEGIN
    -- 1. Get the Computer Science Department ID
    SELECT id INTO v_dept_id FROM public.departments WHERE code = 'CS' LIMIT 1;

    -- If the department doesn't exist, create it (fallback)
    IF v_dept_id IS NULL THEN
        RAISE NOTICE 'CS Department not found, creating it...';
        -- Note: This requires a campus to exist. Assuming 'Main Campus' from previous scripts.
        INSERT INTO public.departments (campus_id, name, code)
        SELECT id, 'Computer Science', 'CS' FROM public.campuses WHERE name = 'Main Campus'
        RETURNING id INTO v_dept_id;
    END IF;

    -- 2. Insert the exhaustive course list
    -- We use ON CONFLICT to prevent errors if you run this script multiple times.

    -- Year 1: Semester 1 & 2
    INSERT INTO public.courses (department_id, course_code, title, credit_hours, lecture_hours, lab_hours, description)
    VALUES 
    (v_dept_id, 'CS-101', 'Introduction to Computing', 3, 3, 0, 'Fundamental concepts of computer science and computing environments.'),
    (v_dept_id, 'MT-101', 'Calculus & Analytical Geometry', 3, 3, 0, 'Foundational mathematics for engineering and science.'),
    (v_dept_id, 'EN-101', 'English Composition', 3, 3, 0, 'Enhancing academic writing and communication skills.'),
    (v_dept_id, 'CS-102', 'Programming Fundamentals', 4, 3, 3, 'Basic programming constructs, data types, and algorithms using C++.'),
    (v_dept_id, 'MT-102', 'Linear Algebra', 3, 3, 0, 'Matrix algebra, vector spaces, and linear transformations.'),
    (v_dept_id, 'PH-101', 'Applied Physics', 3, 3, 0, 'Physical principles applied to computing and electronics.')
    ON CONFLICT (course_code) DO NOTHING;

    -- Year 2: Semester 3 & 4
    INSERT INTO public.courses (department_id, course_code, title, credit_hours, lecture_hours, lab_hours, description)
    VALUES 
    (v_dept_id, 'CS-201', 'Object Oriented Programming', 4, 3, 3, 'Classes, inheritance, polymorphism, and advanced OOP design patterns.'),
    (v_dept_id, 'CS-204', 'Digital Logic Design', 3, 2, 3, 'Combinational and sequential logic circuit design.'),
    (v_dept_id, 'MT-201', 'Discrete Structures', 3, 3, 0, 'Mathematical structures for computer science, logic, and set theory.'),
    (v_dept_id, 'CS-202', 'Data Structures & Algorithms', 4, 3, 3, 'Linear and non-linear data structures and complexity analysis.'),
    (v_dept_id, 'CS-203', 'Computer Architecture', 3, 3, 0, 'Instruction set architecture, pipelining, and memory hierarchy.'),
    (v_dept_id, 'MT-202', 'Probability & Statistics', 3, 3, 0, 'Statistical methods and probabilistic reasoning for data analysis.')
    ON CONFLICT (course_code) DO NOTHING;

    -- Year 3: Semester 5 & 6
    INSERT INTO public.courses (department_id, course_code, title, credit_hours, lecture_hours, lab_hours, description)
    VALUES 
    (v_dept_id, 'CS-301', 'Database Systems', 4, 3, 3, 'Relational model, SQL, normalization, and transaction management.'),
    (v_dept_id, 'CS-302', 'Operating Systems', 4, 3, 3, 'Process management, memory management, and file systems.'),
    (v_dept_id, 'CS-303', 'Theory of Automata', 3, 3, 0, 'Formal languages, grammars, and computational models.'),
    (v_dept_id, 'CS-305', 'Software Engineering', 4, 3, 3, 'Software development lifecycles, requirements engineering, and testing.'),
    (v_dept_id, 'CS-306', 'Computer Networks', 4, 3, 3, 'Protocol layers, network architectures, and security fundamentals.'),
    (v_dept_id, 'CS-307', 'Artificial Intelligence', 4, 3, 3, 'Search strategies, knowledge representation, and machine learning basics.')
    ON CONFLICT (course_code) DO NOTHING;

    -- Year 4: Semester 7 & 8
    INSERT INTO public.courses (department_id, course_code, title, credit_hours, lecture_hours, lab_hours, description)
    VALUES 
    (v_dept_id, 'CS-401', 'Information Security', 3, 3, 0, 'Cryptographic protocols, network security, and risk management.'),
    (v_dept_id, 'CS-402', 'Compiler Construction', 3, 3, 0, 'Lexical analysis, parsing, and code generation techniques.'),
    (v_dept_id, 'CS-451', 'Cloud Computing', 3, 3, 0, 'Distributed systems, virtualization, and cloud infrastructure.'),
    (v_dept_id, 'CS-462', 'Data Science & Big Data', 3, 3, 0, 'Mining large-scale datasets and predictive modeling.'),
    (v_dept_id, 'CS-473', 'Machine Learning', 3, 3, 0, 'Supervised and unsupervised learning, neural networks, and deep learning.'),
    (v_dept_id, 'CS-480', 'Blockchain Technologies', 3, 3, 0, 'Decentralized systems, smart contracts, and cryptocurrency fundamentals.'),
    (v_dept_id, 'CS-498', 'Final Year Project I', 3, 0, 9, 'Phase 1 of the capstone software development project.'),
    (v_dept_id, 'CS-499', 'Final Year Project II', 3, 0, 9, 'Phase 2 of the capstone software development project.')
    ON CONFLICT (course_code) DO NOTHING;

    RAISE NOTICE 'Massive Course Seed Completed Successfully.';
END $$;
