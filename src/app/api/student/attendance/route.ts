import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const sectionId = searchParams.get('sectionId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch enrolled courses with section + course info
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('course_registrations')
      .select(`
        section_id,
        sections (
          id,
          section_name,
          courses (
            course_code,
            title,
            credit_hours
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'Approved');

    if (regError) throw regError;

    // 2. Fetch attendance records
    let attendanceQuery = supabaseAdmin
      .from('attendance')
      .select('id, date, status, section_id')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    // If a specific section is requested, filter by it
    if (sectionId) {
      attendanceQuery = attendanceQuery.eq('section_id', sectionId);
    }

    const { data: attendanceData, error: attError } = await attendanceQuery;

    if (attError) throw attError;

    return NextResponse.json({
      courses: (registrations || []).map((reg: any) => ({
        section_id: reg.section_id,
        section_name: reg.sections?.section_name || 'N/A',
        course_code: reg.sections?.courses?.course_code || 'N/A',
        course_title: reg.sections?.courses?.title || 'Unknown Course',
        credit_hours: reg.sections?.courses?.credit_hours || 0,
      })),
      attendance: attendanceData || [],
    });
  } catch (error: any) {
    console.error('Student attendance API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
