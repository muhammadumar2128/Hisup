import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { facultyId, sectionId } = await request.json();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
       return NextResponse.json({ 
         error: 'Admin configuration incomplete. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file to allow faculty assignments.' 
       }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Force Upsert Faculty Profile
    const { error: upsertError } = await supabaseAdmin
      .from('faculty_profiles')
      .upsert([{
        id: facultyId,
        employee_id: `EMP-${Math.floor(Math.random()*10000)}`,
        designation: 'Lecturer',
        joining_date: new Date().toISOString().split('T')[0]
      }], { onConflict: 'id' });

    if (upsertError) throw upsertError;

    // 2. Assign to section
    const { error: assignError } = await supabaseAdmin
      .from('sections')
      .update({ faculty_id: facultyId })
      .eq('id', sectionId);

    if (assignError) throw assignError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
