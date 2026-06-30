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
  env.SUPABASE_SERVICE_ROLE_KEY // Use service role to check full database contents
);

async function debugDashboard() {
  console.log("=== Debugging Admin Dashboard Stats ===");

  // 1. Check Roles
  const { data: roles, error: rolesErr } = await supabase.from('roles').select('*');
  if (rolesErr) console.error("Roles error:", rolesErr);
  else console.log("Roles table content:", roles);

  // 2. Check Users
  const { data: users, error: usersErr } = await supabase.from('users').select('*');
  if (usersErr) console.error("Users error:", usersErr);
  else {
    console.log(`Total users in table: ${users.length}`);
    const dist = {};
    users.forEach(u => {
      dist[u.role_id] = (dist[u.role_id] || 0) + 1;
    });
    console.log("Users distribution by role_id:", dist);
  }

  // 3. Check Courses & Registrations
  const { count: coursesCount, error: coursesErr } = await supabase.from('courses').select('id', { count: 'exact', head: true });
  const { count: enrollmentsCount, error: enrollmentsErr } = await supabase.from('course_registrations').select('id', { count: 'exact', head: true });

  console.log("Courses Count:", coursesCount, coursesErr ? `Error: ${coursesErr.message}` : "OK");
  console.log("Enrollments Count:", enrollmentsCount, enrollmentsErr ? `Error: ${enrollmentsErr.message}` : "OK");
}

debugDashboard();
