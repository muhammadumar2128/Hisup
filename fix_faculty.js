const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function authAdminBypass() {
    // 1. Get an existing admin token or use login to get an access token
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: 'admin@hitec.edu.pk',
        password: 'password123'
    });
    
    if (error) {
       console.log('Login failed', error.message);
       return;
    }
    
    console.log('Logged in as Admin');
    
    const facId = '480b5716-de61-4ab7-94fe-80fb80a66a95';
    const sectionId = 'ad2128bd-b32b-4584-9ca7-123fbfdce92e';
    
    // Test direct upsert to faculty_profiles
    const { error: upsertErr } = await supabase.from('faculty_profiles').upsert([{
      id: facId,
      employee_id: `EMP-${Math.floor(Math.random()*10000)}`,
      designation: 'Lecturer',
      joining_date: '2024-01-01'
    }]);
    
    console.log('Upsert Error:', upsertErr);
    
    const { error: updateErr } = await supabase.from('sections').update({ faculty_id: facId }).eq('id', sectionId);
    console.log('Section Update Error:', updateErr);
}
authAdminBypass();
