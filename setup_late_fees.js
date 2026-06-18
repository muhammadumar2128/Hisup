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
-- 1. Add late_fee_amount column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='late_fee_amount') THEN
        ALTER TABLE public.invoices ADD COLUMN late_fee_amount DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
END $$;

-- 2. Create a function to apply late fees
-- This function finds all 'Unpaid' invoices past their due date, changes them to 'Overdue', and adds a 1000 PKR fine.
CREATE OR REPLACE FUNCTION apply_late_fees()
RETURNS VOID AS $$
BEGIN
    UPDATE public.invoices
    SET 
        status = 'Overdue',
        late_fee_amount = 1000.00
    WHERE 
        status = 'Unpaid' 
        AND due_date < CURRENT_DATE
        AND late_fee_amount = 0.00;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
`;

async function runSql() {
  // We can't reliably run DDL via RPC if exec_sql doesn't exist, but let's try.
  // Actually, since exec_sql didn't work before, I will instruct the user to run this in the Supabase editor.
  console.log("SQL generated.");
}
runSql();
