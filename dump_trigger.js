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

async function dumpTrigger() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = \'generate_invoice_on_approval\'' });
  console.log("Trigger error:", error);
  console.log("Trigger data:", data);
}
dumpTrigger();
