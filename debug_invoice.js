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

async function debugInvoice() {
  console.log("1. Finding an approved registration...");
  const { data: regs, error: regErr } = await supabase.from('course_registrations').select('*').eq('status', 'Approved').limit(1);
  
  if (regErr || !regs || regs.length === 0) {
    console.log("No approved registrations found.", regErr);
    return;
  }
  
  const reg = regs[0];
  console.log("Found Registration:", reg);
  
  console.log("\n2. Checking associated section...");
  const { data: section, error: secErr } = await supabase.from('sections').select('*').eq('id', reg.section_id).single();
  console.log("Section:", section);
  if (secErr) console.log("Section Error:", secErr);
  
  if (!section) return;
  
  console.log("\n3. Checking associated course...");
  const { data: course, error: courseErr } = await supabase.from('courses').select('*').eq('id', section.course_id).single();
  console.log("Course:", course);
  
  console.log("\n4. Checking associated semester...");
  const { data: sem, error: semErr } = await supabase.from('semesters').select('*').eq('id', section.semester_id).single();
  console.log("Semester:", sem);
  
  console.log("\n5. Checking student profile...");
  const { data: student, error: stuErr } = await supabase.from('users').select('*').eq('id', reg.student_id).single();
  console.log("Student User Record:", student);
}

debugInvoice();
