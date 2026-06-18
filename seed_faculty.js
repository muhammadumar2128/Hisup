const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY // fallback to anon if no service key
);

const sql = `
DO $$ 
DECLARE
    v_faculty_id UUID := gen_random_uuid();
    v_role_id UUID;
    v_section_1 UUID;
    v_section_2 UUID;
BEGIN
    -- 1. Get Faculty Role ID
    SELECT id INTO v_role_id FROM public.roles WHERE role_name = 'Faculty';

    -- 2. Create Faculty User in Auth (Password: faculty123)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, instance_id)
    VALUES (
        v_faculty_id,
        'dr.ahmed@hitecuni.edu.pk',
        crypt('faculty123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"first_name":"Dr.","last_name":"Ahmed"}',
        'authenticated',
        'authenticated',
        '00000000-0000-0000-0000-000000000000'
    );

    -- 3. Create in Public Users
    INSERT INTO public.users (id, email, role_id, status)
    VALUES (v_faculty_id, 'dr.ahmed@hitecuni.edu.pk', v_role_id, 'Active');

    -- 4. Create in Public Profiles
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (v_faculty_id, 'Dr.', 'Ahmed');
    
    -- 5. Create in Faculty Profiles
    INSERT INTO public.faculty_profiles (id, department_id, designation, specialization)
    VALUES (v_faculty_id, (SELECT id FROM public.departments LIMIT 1), 'Professor', 'Computer Science');

    -- 6. Assign Faculty to the first two existing sections
    SELECT id INTO v_section_1 FROM public.sections ORDER BY section_name LIMIT 1 OFFSET 0;
    SELECT id INTO v_section_2 FROM public.sections ORDER BY section_name LIMIT 1 OFFSET 1;

    IF v_section_1 IS NOT NULL THEN
        UPDATE public.sections SET faculty_id = v_faculty_id WHERE id = v_section_1;
    END IF;
    
    IF v_section_2 IS NOT NULL THEN
        UPDATE public.sections SET faculty_id = v_faculty_id WHERE id = v_section_2;
    END IF;

    -- 7. Add Policies for Faculty to manage components and marks
    DROP POLICY IF EXISTS component_manage_faculty ON public.assessment_components;
    CREATE POLICY component_manage_faculty ON public.assessment_components 
    FOR ALL USING (get_current_user_role() = 'Faculty' OR get_current_user_role() = 'Admin');
    
    DROP POLICY IF EXISTS marks_manage_faculty ON public.student_marks;
    CREATE POLICY marks_manage_faculty ON public.student_marks 
    FOR ALL USING (get_current_user_role() = 'Faculty' OR get_current_user_role() = 'Admin');

END $$;
`;

async function runSql() {
  console.log("SQL generated.");
}
runSql();
