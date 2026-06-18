const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testTrigger() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const env = envFile.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  // We MUST use service role to bypass RLS for this test
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const testId = '00000000-0000-0000-0000-000000000001';
  const testEmail = 'test_trigger@example.com';

  console.log("Testing sequential insertion (simulating trigger logic)...");

  try {
    // 1. Get Student Role
    const { data: role } = await supabase.from('roles').select('id').eq('role_name', 'Student').single();
    console.log("Found Student Role ID:", role?.id);

    // 2. Insert User
    const { error: uError } = await supabase.from('users').insert({
      id: testId,
      email: testEmail,
      role_id: role?.id,
      status: 'Active'
    });
    if (uError) throw new Error("Users table error: " + uError.message);
    console.log("Step 2 (Users) Passed");

    // 3. Insert Profile
    const { error: pError } = await supabase.from('profiles').insert({
      id: testId,
      first_name: 'Test',
      last_name: 'Trigger',
      cnic: '12345-6789012-3',
      gender: 'Male',
      dob: '2000-01-01'
    });
    if (pError) throw new Error("Profiles table error: " + pError.message);
    console.log("Step 3 (Profiles) Passed");

    // 4. Get a Program ID
    const { data: program } = await supabase.from('programs').select('id').limit(1).single();
    console.log("Using Program ID:", program?.id);

    // 5. Insert Student Profile
    const { error: sError } = await supabase.from('student_profiles').insert({
      id: testId,
      registration_number: 'TEST-REG-' + Date.now(),
      program_id: program?.id,
      enrollment_status: 'Active'
    });
    if (sError) throw new Error("Student Profiles table error: " + sError.message);
    console.log("Step 5 (Student Profiles) Passed");

    console.log("SUCCESS: All tables accepted the data.");

    // Cleanup
    await supabase.from('users').delete().eq('id', testId);

  } catch (err) {
    console.error("FAILURE:", err.message);
  }
}

testTrigger();
