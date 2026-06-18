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

async function testLogin() {
  console.log("Testing login for admin@hitecuni.edu.pk...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@hitecuni.edu.pk',
    password: 'admin123',
  });

  if (error) {
    console.error("Login Failed:", error.message);
  } else {
    console.log("Login Successful!");
    console.log("User ID:", data.user.id);
    
    // Check if the user is in the public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id, email')
      .eq('id', data.user.id)
      .single();
      
    if (userError) {
      console.error("Public Users record error:", userError.message);
    } else {
      console.log("Public Users record found:", userData);
    }
  }
}

testLogin();
