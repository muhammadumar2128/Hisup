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

async function testBorrow() {
  const userId = '21e9a3d4-c4b7-4c79-98e4-27ff8fdd4368'; // Hardcoded student id for test
  
  // 1. Get an available book copy
  const { data: copies, error: copyErr } = await supabase
    .from('book_copies')
    .select('*')
    .eq('status', 'Available')
    .limit(1);
    
  if (copyErr || !copies || copies.length === 0) {
    console.log("No available copies found or error:", copyErr);
    return;
  }
  
  const copyToBorrow = copies[0];
  console.log("Attempting to borrow copy:", copyToBorrow);
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  console.log("1. Testing insert into library_transactions...");
  const { error: txnError } = await supabase.from('library_transactions').insert({
    user_id: userId,
    copy_id: copyToBorrow.id,
    due_date: dueDate.toISOString().split('T')[0],
    status: 'Issued'
  });
  
  if (txnError) console.error("Txn Error:", txnError);
  else console.log("Txn Insert OK");

  console.log("2. Testing update book_copies...");
  const { error: updateErr } = await supabase.from('book_copies')
    .update({ status: 'Issued' })
    .eq('id', copyToBorrow.id);
    
  if (updateErr) console.error("Update Error:", updateErr);
  else console.log("Update OK");
}

testBorrow();
