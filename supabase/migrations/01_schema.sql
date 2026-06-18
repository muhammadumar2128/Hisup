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
    copy_id UUID REFERENCES book_copies(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'Issued' CHECK (status IN ('Issued', 'Returned', 'Overdue'))
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
