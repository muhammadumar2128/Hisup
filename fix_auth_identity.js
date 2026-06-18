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
    v_faculty_id UUID;
    v_role_id INT;
BEGIN
    SELECT id INTO v_faculty_id FROM auth.users WHERE email = 'dr.ahmed@hitecuni.edu.pk' LIMIT 1;
    
    IF v_faculty_id IS NOT NULL THEN
        -- Check if identity exists, if not, create it
        IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_faculty_id) THEN
            INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                v_faculty_id,
                format('{"sub":"%s","email":"%s"}', v_faculty_id::text, 'dr.ahmed@hitecuni.edu.pk')::jsonb,
                'email',
                v_faculty_id::text,
                now(),
                now(),
                now()
            );
        END IF;
    END IF;
END $$;
`;

console.log("Please run the following SQL script in your Supabase SQL Editor to fix the login issue:");
console.log(sql);
