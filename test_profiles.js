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
    email: 'admin@hitecuni.edu.pk',
    password: 'admin123',
  });

  if (loginError) {
    console.error("Login Failed:", loginError.message);
    return;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      users!inner (
        email
      )
    `);
  console.log("Profiles users:", JSON.stringify(data, null, 2));
  if (error) console.log("Error:", error);
}

testFetch();