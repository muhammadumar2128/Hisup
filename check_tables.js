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

async function checkTables() {
  const tables = ['campuses', 'departments', 'programs', 'courses', 'rooms', 'sections', 'class_schedule'];
  console.log("Checking tables...");
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR - ${error.message} (${error.code})`);
    } else {
      console.log(`Table '${table}': OK`);
    }
  }
}

checkTables();
