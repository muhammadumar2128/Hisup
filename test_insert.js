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

async function testInsert() {
  const { data: user } = await supabase.from('users').select('id').limit(1);
  const { data: sem } = await supabase.from('semesters').select('id').limit(1);
  
  if (user && sem && user.length && sem.length) {
    const { error } = await supabase.from('invoices').insert({
      student_id: user[0].id,
      semester_id: sem[0].id,
      total_amount: 15000.00,
      due_date: new Date(Date.now() + 15 * 86400000).toISOString(),
      status: 'Unpaid',
      challan_number: 'TEST-CHL-001'
    });
    console.log("Insert error:", error);
  }
}
testInsert();