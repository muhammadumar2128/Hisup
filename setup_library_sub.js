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
-- 1. Create the library subscriptions table
CREATE TABLE IF NOT EXISTS public.library_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    UNIQUE(student_id)
);

-- 2. Enable RLS
ALTER TABLE public.library_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Set Policies
CREATE POLICY lib_sub_read_own ON public.library_subscriptions FOR SELECT USING (student_id = auth.uid() OR get_current_user_role() = 'Admin');
CREATE POLICY lib_sub_admin_all ON public.library_subscriptions FOR ALL USING (get_current_user_role() = 'Admin');

-- 4. Reload cache
NOTIFY pgrst, 'reload schema';
`;

async function runSql() {
  console.log("SQL generated.");
}
runSql();
