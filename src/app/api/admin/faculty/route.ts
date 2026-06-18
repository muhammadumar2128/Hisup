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

    // Fetch all users with role 'Faculty' (role_id = 2)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        profiles ( first_name, last_name )
      `)
      .eq('role_id', 2);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
