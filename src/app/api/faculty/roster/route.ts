import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabaseAdmin
      .from('course_registrations')
      .select(`
        id,
        student_id,
        profiles!course_registrations_student_id_fkey ( 
          first_name, 
          last_name,
          student_profiles ( registration_number )
        )
      `)
      .eq('section_id', sectionId)
      .eq('status', 'Approved');

    if (error) throw error;

    const mapped = data.map((s: any) => ({
      id: s.id,
      student_id: s.student_id,
      registration_number: s.profiles?.student_profiles?.registration_number || 'N/A',
      name: `${s.profiles?.first_name || 'New'} ${s.profiles?.last_name || 'User'}`
    }));

    return NextResponse.json({ data: mapped });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
