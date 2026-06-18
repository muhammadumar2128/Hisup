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
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFetch() {
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'sarah.smith@student.hitecuni.edu.pk',
    password: 'password123',
  });

  if (loginError) {
    console.error("Login Failed:", loginError.message);
    return;
  }
  console.log("Logged in as Student");

  const { data, error } = await supabase
    .from('library_subscriptions')
    .select(`
      id,
      status,
      profiles (
        first_name,
        users!profiles_id_fkey ( email ),
        student_profiles (
          invoices ( total_amount, status, challan_number, payments ( payment_date ) )
        )
      )
    `);
  console.log("Data:", JSON.stringify(data, null, 2));
  if (error) console.log("Error:", error);
}

testFetch();