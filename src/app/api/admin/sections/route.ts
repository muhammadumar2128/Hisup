import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'Admin configuration incomplete. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.' 
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabaseAdmin
      .from('sections')
      .select(`
        *,
        courses ( course_code, title ),
        faculty_profiles (
          profiles ( first_name, last_name )
        )
      `)
      .order('section_name');

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
