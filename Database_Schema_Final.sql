-- ======================================================================================
-- FINAL PROJECT: DATABASE SCHEMA & ARCHITECTURE
-- System: HITEC Smart University Portal
-- ======================================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================================================================================
-- MODULE 1: CORE IDENTITY & USER MANAGEMENT
-- Demonstrates Role-Based Access Control (RBAC) and User Profiling
-- ======================================================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
    id UUID PRIMARY KEY, -- Linked to Supabase Auth system
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id INT REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended'))
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    cnic VARCHAR(30) UNIQUE,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    dob DATE,
    current_address TEXT,
    permanent_address TEXT
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    row_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ======================================================================================
-- MODULE 2: ACADEMIC HIERARCHY
-- Normalization of Campuses, Departments, Programs, and Semesters
-- ======================================================================================

CREATE TABLE campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    location TEXT NOT NULL
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID REFERENCES campuses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    total_credit_hours INT NOT NULL,
    duration_years DECIMAL(3, 1) NOT NULL
);

CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    semester_number INT NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    term VARCHAR(10) CHECK (term IN ('Fall', 'Spring', 'Summer')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    UNIQUE (program_id, semester_number, academic_year, term)
);


-- ======================================================================================
-- MODULE 3: COURSE MANAGEMENT & SCHEDULING
-- ======================================================================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    credit_hours INT NOT NULL,
    lecture_hours INT NOT NULL,
    lab_hours INT NOT NULL,
    description TEXT
);

CREATE TABLE course_prerequisites (
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    prerequisite_course_id UUID REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (course_id, prerequisite_course_id)
);


-- ======================================================================================
-- MODULE 4: ENTITY SPECIALIZATION (STUDENTS & FACULTY)
-- Demonstrates table inheritance / specialization concept for specific user types
-- ======================================================================================

CREATE TABLE student_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    program_id UUID REFERENCES programs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    current_semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL ON UPDATE CASCADE,
    enrollment_status VARCHAR(20) DEFAULT 'Active' CHECK (enrollment_status IN ('Active', 'Suspended', 'Graduated'))
);

CREATE TABLE faculty_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    designation VARCHAR(100) NOT NULL,
    specialization VARCHAR(150),
    office_room VARCHAR(50),
    joining_date DATE NOT NULL
);


-- ======================================================================================
-- MODULE 5: CLASS SECTIONS & ATTENDANCE
-- ======================================================================================

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID REFERENCES campuses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    building VARCHAR(100),
    capacity INT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Lecture', 'Lab', 'Office')),
    UNIQUE(campus_id, room_number, building)
);

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    section_name VARCHAR(10) NOT NULL,
    max_capacity INT NOT NULL DEFAULT 50,
    UNIQUE(course_id, semester_id, section_name)
);

CREATE TABLE class_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE ON UPDATE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE course_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Dropped')),
    UNIQUE(student_id, section_id)
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('Present', 'Absent', 'Leave')),
    marked_by UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE(section_id, student_id, date)
);


-- ======================================================================================
-- MODULE 6: GRADING & EXAMINATIONS
-- ======================================================================================

CREATE TABLE assessment_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE ON UPDATE CASCADE,
    component_name VARCHAR(50) CHECK (component_name IN ('Quiz', 'Assignment', 'Midterm', 'Final', 'Project')),
    weightage DECIMAL(5, 2) NOT NULL,
    max_marks DECIMAL(5, 2) NOT NULL
);

CREATE TABLE student_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_component_id UUID REFERENCES assessment_components(id) ON DELETE CASCADE ON UPDATE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    obtained_marks DECIMAL(5, 2) NOT NULL,
    remarks TEXT,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_component_id, student_id)
);

CREATE TABLE semester_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    sgpa DECIMAL(4, 3),
    cgpa DECIMAL(4, 3),
    total_credits_earned INT,
    status VARCHAR(20) CHECK (status IN ('Promoted', 'Probation', 'Warning')),
    UNIQUE(student_id, semester_id)
);


-- ======================================================================================
-- MODULE 7: FINANCE & INVOICING
-- ======================================================================================

CREATE TABLE fee_heads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE ON UPDATE CASCADE,
    admission_year VARCHAR(10) NOT NULL,
    fee_head_id UUID REFERENCES fee_heads(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    UNIQUE(program_id, admission_year, fee_head_id)
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid', 'Partial', 'Overdue')),
    challan_number VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(20) CHECK (payment_method IN ('Bank', 'Easypaisa', 'JazzCash', 'Card')),
    transaction_reference VARCHAR(100) UNIQUE NOT NULL
);


-- ======================================================================================
-- MODULE 8: LIBRARY MANAGEMENT
-- ======================================================================================

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
    book_id UUID REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Issued', 'Reserved', 'Damaged')),
    shelf_location VARCHAR(100)
);

CREATE TABLE library_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    UNIQUE(student_id)
);

CREATE TABLE library_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    copy_id UUID REFERENCES book_copies(id) ON DELETE CASCADE ON UPDATE CASCADE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'Issued' CHECK (status IN ('Issued', 'Returned', 'Overdue'))
);

CREATE TABLE library_fines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES library_transactions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    fine_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid')),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL ON UPDATE CASCADE
);


-- ======================================================================================
-- MODULE 9: ADVANCED DATABASE LOGIC (STORED PROCEDURES & TRIGGERS)
-- Demonstrates the ability to automate database workflows upon user registration
-- ======================================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_id INT;
    v_role_name VARCHAR;
    v_program_id UUID;
    v_reg_number VARCHAR;
    v_fee_amount DECIMAL(10,2) := 0;
    v_library_fee DECIMAL(10,2) := 5000.00;
    v_total_fee DECIMAL(10,2) := 0;
    v_challan VARCHAR(50);
    v_semester_id UUID;
BEGIN
    -- 1. Resolve Role mapping
    v_role_name := COALESCE(NEW.raw_user_meta_data->>'role', 'Student');
    SELECT id INTO v_role_id FROM public.roles WHERE role_name = v_role_name;
    
    -- 2. Insert Base User and Profile
    INSERT INTO public.users (id, email, role_id, status)
    VALUES (NEW.id, NEW.email, v_role_id, 'Active');

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
    );

    -- 3. Dynamic Sub-Profile Generation Based on Role
    IF v_role_name = 'Student' THEN
        v_reg_number := 'SP' || TO_CHAR(NOW(), 'YY') || '-' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 8));
        
        BEGIN
            v_program_id := NULLIF(NEW.raw_user_meta_data->>'program_id', '')::UUID;
        EXCEPTION WHEN OTHERS THEN v_program_id := NULL; END;
        
        -- Create Student Academic Profile
        INSERT INTO public.student_profiles (id, registration_number, program_id, enrollment_status)
        VALUES (NEW.id, v_reg_number, v_program_id, 'Active');

        -- Automate Initial Fee Generation (Tuition + Library Fee)
        IF v_program_id IS NOT NULL THEN
            BEGIN
                SELECT COALESCE(SUM(fs.amount), 0) INTO v_fee_amount
                FROM public.fee_structures fs WHERE fs.program_id = v_program_id ORDER BY fs.admission_year DESC LIMIT 1;
            EXCEPTION WHEN OTHERS THEN v_fee_amount := 0; END;
        END IF;

        IF v_fee_amount = 0 THEN v_fee_amount := 15000.00; END IF;
        v_total_fee := v_fee_amount + v_library_fee;
        v_challan := 'REG-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 4);

        -- Dispatch Invoice to Finance Module
        INSERT INTO public.invoices (student_id, semester_id, total_amount, due_date, status, challan_number)
        VALUES (NEW.id, NULL, v_total_fee, CURRENT_DATE + INTERVAL '30 days', 'Unpaid', v_challan);
        
    ELSIF v_role_name = 'Faculty' THEN
        -- Create Faculty Employee Profile
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to Authentication Pipeline
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ======================================================================================
-- MODULE 10: DATABASE SECURITY (ROW LEVEL SECURITY POLICIES)
-- ======================================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_copies ENABLE ROW LEVEL SECURITY;

-- Helper function to resolve role securely
CREATE OR REPLACE FUNCTION get_current_user_role() RETURNS VARCHAR AS $$
DECLARE v_role_name VARCHAR;
BEGIN
    SELECT r.role_name INTO v_role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid();
    RETURN v_role_name;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Base Policies allowing public creation and restricted access
CREATE POLICY profiles_read_all ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_admin_all ON profiles FOR ALL USING (get_current_user_role() = 'Admin');

CREATE POLICY users_read_all ON users FOR SELECT USING (true);
CREATE POLICY users_admin_all ON users FOR ALL USING (get_current_user_role() = 'Admin');

CREATE POLICY faculty_profiles_read_all ON faculty_profiles FOR SELECT USING (true);
CREATE POLICY faculty_profiles_admin_all ON faculty_profiles FOR ALL USING (get_current_user_role() = 'Admin');

-- Student Information Privacy
CREATE POLICY "Students can view own student profile" ON public.student_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can manage all student profiles" ON public.student_profiles FOR ALL USING (public.get_current_user_role() = 'Admin');

-- Financial Information Security
CREATE POLICY invoices_read_own ON public.invoices FOR SELECT USING (student_id = auth.uid());
CREATE POLICY invoices_student_update ON public.invoices FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY invoices_finance_all ON public.invoices FOR ALL USING (get_current_user_role() IN ('Finance', 'Admin'));

CREATE POLICY payments_read_own ON payments FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE student_id = auth.uid()));
CREATE POLICY payments_finance_all ON payments FOR ALL USING (get_current_user_role() IN ('Finance', 'Admin'));

-- Academic Management Privacy
CREATE POLICY course_registrations_read_own ON course_registrations FOR SELECT USING (student_id = auth.uid() OR get_current_user_role() IN ('Admin', 'Faculty'));
CREATE POLICY attendance_read_own ON attendance FOR SELECT USING (student_id = auth.uid());
CREATE POLICY student_marks_read_own ON student_marks FOR SELECT USING (student_id = auth.uid());

CREATE POLICY faculty_manage_attendance ON attendance FOR ALL USING (get_current_user_role() = 'Faculty' AND section_id IN (SELECT id FROM sections WHERE faculty_id = auth.uid()));
CREATE POLICY faculty_manage_marks ON student_marks FOR ALL USING (get_current_user_role() = 'Faculty' AND assessment_component_id IN (SELECT id FROM assessment_components WHERE section_id IN (SELECT id FROM sections WHERE faculty_id = auth.uid())));

-- Library Management Isolation
CREATE POLICY "Students can view their own subscriptions" ON public.library_subscriptions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can update their own subscriptions" ON public.library_subscriptions FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Admins and librarians have full access" ON public.library_subscriptions FOR ALL USING (public.get_current_user_role() IN ('Admin', 'Librarian'));

CREATE POLICY books_read_all ON books FOR SELECT USING (true);
CREATE POLICY books_librarian_all ON books FOR ALL USING (get_current_user_role() IN ('Librarian', 'Admin'));
CREATE POLICY book_copies_read_all ON book_copies FOR SELECT USING (true);
CREATE POLICY book_copies_librarian_all ON book_copies FOR ALL USING (get_current_user_role() IN ('Librarian', 'Admin'));


-- ======================================================================================
-- MODULE 11: QUERY OPTIMIZATION (INDEXES & VIEWS)
-- Addresses: Views, Indexes, CTEs, and Window Functions
-- ======================================================================================

-- 1. Indexes for Performance Optimization
CREATE INDEX idx_student_program ON student_profiles(program_id);
CREATE INDEX idx_course_registration_student ON course_registrations(student_id);
CREATE INDEX idx_invoices_student ON invoices(student_id);

-- 2. Advanced View using Common Table Expressions (CTEs) and Window Functions
-- This view calculates the rank of students within their program based on their CGPA.
CREATE OR REPLACE VIEW vw_student_academic_ranking AS
WITH StudentGrades AS (
    -- CTE to gather basic student data
    SELECT 
        sp.id AS student_id,
        p.first_name || ' ' || p.last_name AS student_name,
        prog.name AS program_name,
        sr.cgpa
    FROM student_profiles sp
    JOIN profiles p ON sp.id = p.id
    JOIN programs prog ON sp.program_id = prog.id
    JOIN semester_results sr ON sp.id = sr.student_id
)
SELECT 
    student_id,
    student_name,
    program_name,
    cgpa,
    -- Window Function to calculate Rank within the specific program
    RANK() OVER(PARTITION BY program_name ORDER BY cgpa DESC) as program_rank
FROM StudentGrades;


-- ======================================================================================
-- MODULE 12: TRANSACTION MANAGEMENT & ADVANCED PROCEDURES
-- Addresses: Stored Procedures, Transaction Management, and Dynamic SQL
-- ======================================================================================

-- Stored Procedure with explicit Transaction Control to process fee payments
CREATE OR REPLACE PROCEDURE sp_process_fee_payment(
    p_invoice_id UUID,
    p_amount_paid DECIMAL,
    p_payment_method VARCHAR,
    p_transaction_ref VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_due DECIMAL;
    v_current_status VARCHAR;
BEGIN
    -- Explicit transaction behavior is inherent in Postgres Procedures
    -- Fetch current invoice details safely
    SELECT total_amount, status INTO v_total_due, v_current_status 
    FROM invoices 
    WHERE id = p_invoice_id 
    FOR UPDATE; -- Row-level lock to prevent concurrent corruption

    IF v_current_status = 'Paid' THEN
        RAISE EXCEPTION 'Invoice is already fully paid.';
    END IF;

    -- Insert the payment record
    INSERT INTO payments (invoice_id, amount_paid, payment_method, transaction_reference)
    VALUES (p_invoice_id, p_amount_paid, p_payment_method, p_transaction_ref);

    -- Update Invoice Status Dynamically
    IF p_amount_paid >= v_total_due THEN
        UPDATE invoices SET status = 'Paid' WHERE id = p_invoice_id;
    ELSE
        UPDATE invoices SET status = 'Partial' WHERE id = p_invoice_id;
    END IF;

    -- Transaction Commits Automatically if no exception is raised
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        -- Transaction Rolls Back automatically on error
        ROLLBACK;
        RAISE;
END;
$$;
