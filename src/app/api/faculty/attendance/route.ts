import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { attendanceRecords, facultyId, sectionId } = await request.json();

    if (!attendanceRecords || !facultyId || !sectionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Verify that the faculty actually owns this section
    const { data: sectionData, error: sectionErr } = await supabaseAdmin
      .from('sections')
      .select('id')
      .eq('id', sectionId)
      .eq('faculty_id', facultyId)
      .single();

    if (sectionErr || !sectionData) {
      return NextResponse.json({ error: 'Unauthorized: You are not assigned to this section.' }, { status: 403 });
    }

    // 2. Perform the upsert using Service Role
    const { error: upsertError } = await supabaseAdmin
      .from('attendance')
      .upsert(attendanceRecords, {
        onConflict: 'section_id,student_id,date'
      });

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
