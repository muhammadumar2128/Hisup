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
  const userId = '21e9a3d4-c4b7-4c79-98e4-27ff8fdd4368'; // hardcoded student id for testing

  console.log("1. Testing Subscriptions...");
  const { error: subErr } = await supabase
    .from('library_subscriptions')
    .select('*')
    .eq('student_id', userId)
    .eq('status', 'Active')
    .limit(1)
    .single();
  if (subErr && subErr.code !== 'PGRST116') console.error("Sub Error:", subErr);
  else console.log("Sub OK");

  console.log("2. Testing Transactions...");
  const { error: txnErr } = await supabase
    .from('library_transactions')
    .select(`
      id,
      issue_date,
      due_date,
      return_date,
      status,
      book_copies (
        barcode,
        books (
          title,
          isbn,
          publisher
        )
      )
    `)
    .eq('user_id', userId)
    .order('issue_date', { ascending: false });
  if (txnErr) console.error("Txn Error:", txnErr);
  else console.log("Txn OK");

  console.log("3. Testing Books Catalog...");
  const { error: bookErr } = await supabase
    .from('books')
    .select(`
      id, title, isbn, publisher, category,
      book_copies ( id, barcode, status )
    `);
  if (bookErr) console.error("Book Error:", bookErr);
  else console.log("Book OK");
}

testFetch();
