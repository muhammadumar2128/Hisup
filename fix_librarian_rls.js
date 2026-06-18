// Add RLS policy for Librarians to read invoices and payments
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1] || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    -- Allow Librarians to read library invoices
    DROP POLICY IF EXISTS invoices_librarian_lib ON invoices;
    CREATE POLICY invoices_librarian_lib ON invoices 
    FOR SELECT 
    USING (check_user_role('Librarian') AND challan_number LIKE 'LIB-%');

    -- Allow Librarians to read payments for those invoices
    DROP POLICY IF EXISTS payments_librarian_lib ON payments;
    CREATE POLICY payments_librarian_lib ON payments 
    FOR SELECT 
    USING (check_user_role('Librarian') AND invoice_id IN (SELECT id FROM invoices WHERE challan_number LIKE 'LIB-%'));

    -- Allow Librarians to read student_profiles (needed to join invoices)
    DROP POLICY IF EXISTS student_profiles_librarian_all ON student_profiles;
    CREATE POLICY student_profiles_librarian_all ON student_profiles 
    FOR SELECT 
    USING (check_user_role('Librarian'));

    -- Allow Librarians to read library_subscriptions (if missing)
    DROP POLICY IF EXISTS lib_sub_librarian_all ON library_subscriptions;
    CREATE POLICY lib_sub_librarian_all ON library_subscriptions 
    FOR SELECT 
    USING (check_user_role('Librarian'));
  `;

  // We don't have a direct SQL execution API in supabase-js, but we can write a function or use postgres function.
  // Wait, does the project have an admin SQL execution function? Usually no.
  // I should just use `psql` if I had connection string, but I don't.
  console.log("We need to add this SQL to the migrations or run it.");
}
run();
