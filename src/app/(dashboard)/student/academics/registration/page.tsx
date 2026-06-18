'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CheckCircle, Info, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Section {
  id: string;
  section_name: string;
  max_capacity: number;
  courses: {
    course_code: string;
    title: string;
    credit_hours: number;
    description?: string;
    fee_per_credit?: number;
  };
  semesters: {
    semester_number: number;
    term: string;
    academic_year: string;
  };
}

export default function StudentRegistration() {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [registeredSections, setRegisteredSections] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Modal State
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  useEffect(() => {
    async function fetchAvailableSections() {
      if (!user) return;
      
      try {
        setLoading(true);
        // 1. Get the student's program ID
        const { data: profileData, error: profileError } = await supabase
          .from('student_profiles')
          .select('program_id')
          .eq('id', user.id)
          .maybeSingle();

        // It's okay if profileError happens (e.g. PGRST116 when no row is found)
        const programId = profileData?.program_id;

        // 2. Fetch sections ONLY for this program's semesters (or all active if no programId)
        let query = supabase
          .from('sections')
          .select(`
            id,
            section_name,
            max_capacity,
            courses (
              course_code,
              title,
              credit_hours,
              description,
              fee_per_credit
            ),
            semesters!inner (
              semester_number,
              term,
              academic_year,
              is_active,
              program_id
            )
          `)
          .eq('semesters.is_active', true);

        if (programId) {
           query = query.eq('semesters.program_id', programId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setSections(data as any || []);
      } catch (error) {
        console.error("Error fetching sections:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailableSections();
  }, [user]);

  const handleRegister = async () => {
    if (!selectedSection) return;
    const sectionId = selectedSection.id;
    
    setRegistering(sectionId);
    setMessage(null);
    setSelectedSection(null); // Close modal

    const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newRegistered = [...registeredSections, sectionId];
      setRegisteredSections(newRegistered);
      localStorage.setItem('demo_registrations', JSON.stringify(newRegistered));
      setMessage({ type: 'success', text: `Successfully registered for ${selectedSection.courses.title}!` });
      setRegistering(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('course_registrations')
        .insert([{ student_id: user?.id, section_id: sectionId, status: 'Pending' }]);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Registration request submitted successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to register.' });
    } finally {
      setRegistering(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-64 bg-gray-200 rounded-lg"></div>
    </div>;
  }

  return (
    <div className="space-y-6 relative">
      {/* Course Detail Modal Overlay */}
      {selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-2">
                <Info className="text-blue-600 h-5 w-5" />
                <CardTitle className="text-xl">Course Details</CardTitle>
              </div>
              <button onClick={() => setSelectedSection(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <XCircle size={24} />
              </button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Course Name</h4>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedSection.courses.title}</p>
                  <p className="text-sm text-blue-600 font-medium">{selectedSection.courses.course_code}</p>
               </div>
               
               <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Description</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                    {selectedSection.courses.description || "Detailed course description will be available in the department catalog."}
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Section</h4>
                    <p className="font-bold">{selectedSection.section_name}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Credit Hours</h4>
                    <p className="font-bold">{selectedSection.courses.credit_hours} Cr. Hrs</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Term</h4>
                    <p className="font-bold">{selectedSection.semesters.term} {selectedSection.semesters.academic_year}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Semester</h4>
                    <p className="font-bold">Semester {selectedSection.semesters.semester_number}</p>
                  </div>
               </div>

               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Fee per Credit Hour</span>
                    <span className="font-bold text-blue-800 dark:text-blue-200">PKR {(selectedSection.courses.fee_per_credit || 3000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                    <span className="text-base font-bold text-blue-900 dark:text-blue-100">Total Course Fee</span>
                    <span className="text-lg font-black text-blue-900 dark:text-blue-100">PKR {((selectedSection.courses.fee_per_credit || 3000) * selectedSection.courses.credit_hours).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 italic">* This is an estimated tuition fee and will be added to your semester invoice upon approval.</p>
               </div>

               <div className="flex space-x-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedSection(null)}>Cancel</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleRegister}>Confirm Registration</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <Link href="/student/academics" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course Registration</h1>
          <p className="text-muted-foreground">Select sections for the current semester to enroll.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md flex items-center justify-between ${
          message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' && <CheckCircle size={18} />}
            <span className="font-medium">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-current opacity-60 hover:opacity-100">
            <XCircle size={18} />
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Course Offerings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => {
                const isRegistered = registeredSections.includes(section.id);
                return (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">{section.courses.course_code}</TableCell>
                    <TableCell>{section.courses.title}</TableCell>
                    <TableCell>{section.section_name}</TableCell>
                    <TableCell>{section.semesters.term} {section.semesters.academic_year}</TableCell>
                    <TableCell>{section.courses.credit_hours}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant={isRegistered ? "outline" : "default"}
                        onClick={() => isRegistered ? null : setSelectedSection(section)}
                        disabled={registering === section.id || isRegistered}
                        className={isRegistered ? "border-green-500 text-green-600 bg-green-50" : ""}
                      >
                        {registering === section.id ? 'Processing...' : isRegistered ? 'Registered' : 'Register'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
