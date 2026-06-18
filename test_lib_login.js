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

async function testPasswords() {
  const passwords = ['librarian123', 'admin123', 'password123', '12345678', 'password'];
  
  for (const pwd of passwords) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'librarian@hitecuni.edu.pk',
      password: pwd,
    });
    
    if (!error) {
      console.log(`Success! Password is: ${pwd}`);
      return;
    }
  }
  console.log('Password not found in the common list.');
}

testPasswords();
