const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkRLS() {
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

  console.log("Checking RLS on 'users' table...");
  
  // Try to select from users
  const { data, error, status } = await supabase.from('users').select('*');
  
  if (error) {
    console.error("Error selecting from users:", error);
  } else {
    console.log("Successfully selected from users. Rows:", data.length);
    console.log("Data:", data);
  }

  // Check if we can see profiles
  const { data: pData, error: pError } = await supabase.from('profiles').select('*');
  if (pError) {
    console.error("Error selecting from profiles:", pError);
  } else {
    console.log("Successfully selected from profiles. Rows:", pData.length);
  }
}

checkRLS();
