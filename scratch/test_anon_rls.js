const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const parts = line.split('=');
  const key = parts[0];
  const value = parts.slice(1).join('=');
  if (key && value) acc[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use anon key to test RLS
);

async function testRLS() {
  console.log("=== Testing RLS with Anon Key ===");

  // Try fetching users
  const { data: users, error: usersErr } = await supabase.from('users').select('role_id');
  if (usersErr) {
    console.error("Users query error:", usersErr.message, usersErr.code);
  } else {
    console.log(`Successfully fetched ${users.length} users using anon key`);
    if (users.length > 0) {
      console.log("First user:", users[0]);
      console.log("role_id type:", typeof users[0].role_id);
    }
  }

  // Try fetching courses
  const { count: coursesCount, error: coursesErr } = await supabase.from('courses').select('id', { count: 'exact', head: true });
  if (coursesErr) {
    console.error("Courses count error:", coursesErr.message, coursesErr.code);
  } else {
    console.log(`Successfully fetched courses count: ${coursesCount}`);
  }
}

testRLS();
