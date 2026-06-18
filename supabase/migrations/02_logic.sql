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
