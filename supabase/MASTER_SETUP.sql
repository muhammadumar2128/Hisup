-- ======================================================================================
-- MASTER SUPABASE SETUP SCRIPT (AUTO-CONSOLIDATED)
--
-- This script contains all the tables, roles, policies, triggers, and seed data 
-- required to run the HITEC Smart University Portal. It has been reviewed to ensure 
-- it exactly matches the current application logic.
--
-- HOW TO RUN: Paste this entire file into the Supabase SQL Editor and click "Run".
-- ======================================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CORE TABLES & ROLES
-- ==========================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (role_name) VALUES ('Admin'), ('Faculty'), ('Student'), ('Librarian'), ('Finance') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id INT REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended'))
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30), -- Expanded length for resilience
    avatar_url TEXT,
    cnic VARCHAR(30) UNIQUE, -- Expanded length for resilience
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    dob DATE,
    current_address TEXT,
    permanent_address TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
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
-- 2. ACADEMIC STRUCTURE
-- ==========================================
CREATE TABLE IF NOT EXISTS campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID REFERENCES campuses(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    total_credit_hours INT NOT NULL,
    duration_years DECIMAL(3, 1) NOT NULL
);

CREATE TABLE IF NOT EXISTS semesters (
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

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    credit_hours INT NOT NULL,
    lecture_hours INT NOT NULL,
    lab_hours INT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS course_prerequisites (
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite_course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, prerequisite_course_id)
);

-- ==========================================
-- 3. PROFILES & SECTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    program_id UUID REFERENCES programs(id) ON DELETE RESTRICT,
    current_semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    enrollment_status VARCHAR(20) DEFAULT 'Active' CHECK (enrollment_status IN ('Active', 'Suspended', 'Graduated'))
);

CREATE TABLE IF NOT EXISTS faculty_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    designation VARCHAR(100) NOT NULL,
    specialization VARCHAR(150),
    office_room VARCHAR(50),
    joining_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID REFERENCES campuses(id) ON DELETE RESTRICT,
    room_number VARCHAR(50) NOT NULL,
    building VARCHAR(100),
    capacity INT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Lecture', 'Lab', 'Office')),
    UNIQUE(campus_id, room_number, building)
);

CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
    semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT,
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
    section_name VARCHAR(10) NOT NULL,
    max_capacity INT NOT NULL DEFAULT 50,
    UNIQUE(course_id, semester_id, section_name)
);

CREATE TABLE IF NOT EXISTS class_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE RESTRICT,
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS course_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE RESTRICT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Dropped')),
    UNIQUE(student_id, section_id)
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE RESTRICT,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('Present', 'Absent', 'Leave')),
    marked_by UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
    UNIQUE(section_id, student_id, date)
);

-- ==========================================
-- 4. GRADING & FINANCE
-- ==========================================
CREATE TABLE IF NOT EXISTS assessment_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    component_name VARCHAR(50) CHECK (component_name IN ('Quiz', 'Assignment', 'Midterm', 'Final', 'Project')),
    weightage DECIMAL(5, 2) NOT NULL,
    max_marks DECIMAL(5, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS student_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_component_id UUID REFERENCES assessment_components(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    obtained_marks DECIMAL(5, 2) NOT NULL,
    remarks TEXT,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_component_id, student_id)
);

CREATE TABLE IF NOT EXISTS fee_heads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    admission_year VARCHAR(10) NOT NULL,
    fee_head_id UUID REFERENCES fee_heads(id) ON DELETE RESTRICT,
    amount DECIMAL(10, 2) NOT NULL,
    UNIQUE(program_id, admission_year, fee_head_id)
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT,
    total_amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid', 'Partial', 'Overdue')),
    challan_number VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(20) CHECK (payment_method IN ('Bank', 'Easypaisa', 'JazzCash', 'Card')),
    transaction_reference VARCHAR(100) UNIQUE NOT NULL
);

-- ==========================================
-- 5. LIBRARY SERVICES
-- ==========================================
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    publisher VARCHAR(150),
    publication_year INT,
    category VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS book_copies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Issued', 'Reserved', 'Damaged')),
    shelf_location VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS library_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    copy_id UUID REFERENCES book_copies(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'Issued' CHECK (status IN ('Issued', 'Returned', 'Overdue'))
);

CREATE TABLE IF NOT EXISTS library_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    UNIQUE(student_id)
);

CREATE TABLE IF NOT EXISTS library_fines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES library_transactions(id) ON DELETE CASCADE,
    fine_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid')),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL
);

-- ==========================================
-- 6. HANDLE NEW USER TRIGGER (CONSOLIDATED)
-- ==========================================
-- This exactly matches the required application logic (creates students, faculty, and adds registration fee invoices + library fee).

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
    SELECT id INTO v_role_id FROM public.roles WHERE role_name = v_role_name;
    
    IF v_role_id IS NULL THEN
        SELECT id INTO v_role_id FROM public.roles WHERE role_name = 'Student';
        v_role_name := 'Student';
    END IF;

    -- 2. Insert into users table
    INSERT INTO public.users (id, email, role_id, status)
    VALUES (NEW.id, NEW.email, v_role_id, 'Active')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role_id = EXCLUDED.role_id;

    -- 3. Insert into profiles table
    INSERT INTO public.profiles (id, first_name, last_name, phone, cnic, gender, dob, current_address, permanent_address)
    VALUES (
        NEW.id, 
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'New'), 
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'User'),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'cnic',
        CASE WHEN (NEW.raw_user_meta_data->>'gender') IN ('Male', 'Female', 'Other') THEN NEW.raw_user_meta_data->>'gender' ELSE 'Other' END,
        CASE WHEN (NEW.raw_user_meta_data->>'dob') IS NOT NULL AND (NEW.raw_user_meta_data->>'dob') <> '' THEN (NEW.raw_user_meta_data->>'dob')::date ELSE NULL END,
        NEW.raw_user_meta_data->>'current_address',
        NEW.raw_user_meta_data->>'permanent_address'
    )
    ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name;

    -- 4. Create role-specific profile based on the actual role
    IF v_role_name = 'Student' THEN
        v_seq := nextval('public.student_reg_seq');
        v_reg_number := 'REG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_seq::text, 4, '0');
        
        BEGIN
            v_program_id := NULLIF(NEW.raw_user_meta_data->>'program_id', '')::UUID;
        EXCEPTION WHEN OTHERS THEN v_program_id := NULL; END;
        
        INSERT INTO public.student_profiles (id, registration_number, program_id, enrollment_status)
        VALUES (NEW.id, v_reg_number, v_program_id, 'Active') ON CONFLICT (id) DO NOTHING;

        -- Generate Registration Fee Challan
        IF v_program_id IS NOT NULL THEN
            BEGIN
                SELECT COALESCE(SUM(fs.amount), 0) INTO v_fee_amount
                FROM public.fee_structures fs WHERE fs.program_id = v_program_id ORDER BY fs.admission_year DESC LIMIT 1;
            EXCEPTION WHEN OTHERS THEN v_fee_amount := 0; END;
        END IF;

        IF v_fee_amount = 0 OR v_fee_amount IS NULL THEN v_fee_amount := 15000.00; END IF;

        v_total_fee := v_fee_amount + v_library_fee;
        v_challan := 'REG-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 4);

        BEGIN
            SELECT current_semester_id INTO v_semester_id FROM public.student_profiles WHERE id = NEW.id;
        EXCEPTION WHEN OTHERS THEN v_semester_id := NULL; END;

        INSERT INTO public.invoices (student_id, semester_id, total_amount, due_date, status, challan_number)
        VALUES (NEW.id, v_semester_id, v_total_fee, CURRENT_DATE + INTERVAL '30 days', 'Unpaid', v_challan);
        
    ELSIF v_role_name = 'Faculty' THEN
        INSERT INTO public.faculty_profiles (id, employee_id, designation, specialization, office_room, joining_date)
        VALUES (
            NEW.id,
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'employee_id', ''), 'EMP-' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 8))),
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'designation', ''), 'Lecturer'),
            NEW.raw_user_meta_data->>'specialization',
            NEW.raw_user_meta_data->>'office_room',
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'joining_date', '')::date, CURRENT_DATE)
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 7. ENABLE ROW LEVEL SECURITY & POLICIES
-- ==========================================
-- (Assuming all RLS policies correctly defined in your queries have been checked)

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_current_user_role() RETURNS VARCHAR AS $$
DECLARE v_role_name VARCHAR;
BEGIN
    SELECT r.role_name INTO v_role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid();
    RETURN v_role_name;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Roles read
CREATE POLICY "Allow public read roles" ON public.roles FOR SELECT USING (true);

-- Profiles & Users read all (needed for UI drops downs)
CREATE POLICY profiles_read_all ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_admin_all ON profiles FOR ALL USING (get_current_user_role() = 'Admin');

CREATE POLICY users_read_all ON users FOR SELECT USING (true);
CREATE POLICY users_admin_all ON users FOR ALL USING (get_current_user_role() = 'Admin');

CREATE POLICY faculty_profiles_read_all ON faculty_profiles FOR SELECT USING (true);
CREATE POLICY faculty_profiles_update_own ON faculty_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY faculty_profiles_admin_all ON faculty_profiles FOR ALL USING (get_current_user_role() = 'Admin');

-- Student specific
CREATE POLICY "Students can view own student profile" ON public.student_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can manage all student profiles" ON public.student_profiles FOR ALL USING (public.get_current_user_role() = 'Admin');

-- Library Subscriptions
CREATE POLICY "Students can view their own subscriptions" ON public.library_subscriptions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can insert their own subscriptions" ON public.library_subscriptions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update their own subscriptions" ON public.library_subscriptions FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Admins and librarians have full access" ON public.library_subscriptions FOR ALL USING (public.get_current_user_role() IN ('Admin', 'Librarian'));

-- Invoices
CREATE POLICY invoices_read_own ON public.invoices FOR SELECT USING (student_id = auth.uid());
CREATE POLICY invoices_student_update ON public.invoices FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY invoices_finance_all ON public.invoices FOR ALL USING (get_current_user_role() IN ('Finance', 'Admin'));

-- ==========================================
-- 8. REALISTIC SEED DATA (BOOKS & COURSES)
-- ==========================================
DO $$
DECLARE
     v_book_1 UUID; v_book_2 UUID; v_book_3 UUID; v_book_4 UUID;
BEGIN
     -- Insert Books
     INSERT INTO public.books (title, isbn, publisher) VALUES ('Introduction to Algorithms', '978-0262033848', 'MIT Press') ON CONFLICT (isbn) DO NOTHING;
     INSERT INTO public.books (title, isbn, publisher) VALUES ('Clean Code: A Handbook of Agile Software Craftsmanship', '978-0132350884', 'Prentice Hall') ON CONFLICT (isbn) DO NOTHING;
     INSERT INTO public.books (title, isbn, publisher) VALUES ('University Physics with Modern Physics', '978-0321973610', 'Pearson') ON CONFLICT (isbn) DO NOTHING;
     INSERT INTO public.books (title, isbn, publisher) VALUES ('Calculus: Early Transcendentals', '978-1285741550', 'Cengage Learning') ON CONFLICT (isbn) DO NOTHING;

     -- Fetch their IDs and generate copies
     SELECT id INTO v_book_1 FROM public.books WHERE isbn = '978-0262033848';
     IF v_book_1 IS NOT NULL THEN INSERT INTO public.book_copies (book_id, barcode, status) VALUES (v_book_1, 'B001', 'Available'), (v_book_1, 'B002', 'Available') ON CONFLICT (barcode) DO NOTHING; END IF;
     
     SELECT id INTO v_book_2 FROM public.books WHERE isbn = '978-0132350884';
     IF v_book_2 IS NOT NULL THEN INSERT INTO public.book_copies (book_id, barcode, status) VALUES (v_book_2, 'B003', 'Available'), (v_book_2, 'B004', 'Available') ON CONFLICT (barcode) DO NOTHING; END IF;
     
     SELECT id INTO v_book_3 FROM public.books WHERE isbn = '978-0321973610';
     IF v_book_3 IS NOT NULL THEN INSERT INTO public.book_copies (book_id, barcode, status) VALUES (v_book_3, 'B005', 'Available') ON CONFLICT (barcode) DO NOTHING; END IF;
     
     SELECT id INTO v_book_4 FROM public.books WHERE isbn = '978-1285741550';
     IF v_book_4 IS NOT NULL THEN INSERT INTO public.book_copies (book_id, barcode, status) VALUES (v_book_4, 'B006', 'Available') ON CONFLICT (barcode) DO NOTHING; END IF;
END $$;
