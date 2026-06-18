import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, password, role, firstName, lastName, 
      programId, employeeId, designation,
      dob, gender, phone, specialization, officeRoom
    } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Admin configuration incomplete.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create user via Supabase Admin API.
    // The handle_new_user() trigger reads ALL fields from user_metadata and automatically:
    //   1. Assigns the correct role (not just Student)
    //   2. Creates student_profiles for Students (with registration number + program)
    //   3. Creates faculty_profiles for Faculty (with employee_id, designation, etc.)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        dob: dob,
        gender: gender,
        // Student-specific
        program_id: programId,
        // Faculty-specific
        employee_id: employeeId,
        designation: designation,
        specialization: specialization,
        office_room: officeRoom,
      }
    });

    if (authError) throw authError;

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error: any) {
    console.error('Error creating user via Admin API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
