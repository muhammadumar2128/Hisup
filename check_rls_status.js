const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Check RLS status of tables
  const { data: rlsTables, error: rlsErr } = await supabase.rpc('check_rls_status');
  
  if (rlsErr) {
    // If RPC doesn't exist, query pg_tables directly using an ad-hoc SQL executor if available,
    // or select via a simple postgres query. Let's do a select from pg_catalog if we can,
    // but we can't run raw SQL directly unless we use an endpoint. Let's try running a query.
    console.log("RPC check_rls_status failed or doesn't exist. Let's query policies.");
  }
  
  // Let's run a query to get policies from pg_policies
  const { data: policies, error: polErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  console.log("Profiles check:", { data: policies, error: polErr });

  // Let's get policies list by querying pg_policies through a helper or just checking profiles select behavior
  // Wait! Let's write a node script that logs in as a student and queries sections.
  // Student email: student1@hitecuni.edu.pk, password: student123?
  // Let's try logging in as student1@hitecuni.edu.pk and password123 or student123.
}

async function testAsStudent() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'student1@hitecuni.edu.pk',
    password: 'password123' // Let's try password123 or check student password
  });
  
  if (authError) {
    console.log("Student auth failed:", authError.message);
    return;
  }
  
  console.log("Logged in as Student:", authData.user.id);
  
  const { data, error } = await supabase
    .from('sections')
    .select(`
      id,
      section_name,
      faculty_id,
      faculty_profiles (
        profiles ( first_name, last_name )
      )
    `);
    
  console.log("Error as Student:", error);
  if (data) {
    const withFaculty = data.filter(d => d.faculty_id);
    console.log("First section with faculty as student:", JSON.stringify(withFaculty[0], null, 2));
  }
}

async function run() {
  await testAsStudent();
}
run();
