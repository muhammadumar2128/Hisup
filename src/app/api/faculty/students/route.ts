import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch assigned sections
    const { data: sectionData, error: sectionErr } = await supabaseAdmin
      .from('sections')
      .select(`
        id,
        section_name,
        courses ( course_code, title )
      `)
      .eq('faculty_id', facultyId);

    if (sectionErr) throw sectionErr;

    if (!sectionData || sectionData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const sectionIds = sectionData.map(s => s.id);

    // 2. Fetch all approved registrations for these sections
    const { data: rosterData, error: rosterErr } = await supabaseAdmin
      .from('course_registrations')
      .select(`
        id,
        student_id,
        section_id,
        student_profiles!course_registrations_student_id_fkey (
          registration_number,
          profiles ( 
            first_name, 
            last_name,
            phone
          )
        )
      `)
      .in('section_id', sectionIds)
      .eq('status', 'Approved');

    if (rosterErr) throw rosterErr;

    // Map data to a flat structure
    const mappedStudents = (rosterData || []).map((reg: any) => {
       const sectionInfo: any = sectionData.find(s => s.id === reg.section_id);
       const studentProfile = reg.student_profiles;
       const profile = studentProfile?.profiles;
       return {
         id: reg.id,
         student_id: reg.student_id,
         registration_number: studentProfile?.registration_number || 'N/A',
         name: `${profile?.first_name || 'New'} ${profile?.last_name || 'User'}`,
         phone: profile?.phone || 'N/A',
         course_code: sectionInfo?.courses?.course_code || 'N/A',
         course_title: sectionInfo?.courses?.title || 'N/A',
         section_name: sectionInfo?.section_name || 'N/A',
         section_id: reg.section_id
       };
    });

    return NextResponse.json({ data: mappedStudents, sections: sectionData.map((s: any) => ({
      id: s.id,
      name: s.section_name,
      course: s.courses?.course_code || 'Unknown'
    })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
