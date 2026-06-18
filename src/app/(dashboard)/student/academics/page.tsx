'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface CourseRegistration {
  id: string;
  status: string;
  sections: {
    section_name: string;
    courses: {
      course_code: string;
      title: string;
      credit_hours: number;
    }
  }
}

export default function StudentAcademics() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAcademics() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('course_registrations')
          .select(`
            id,
            status,
            sections (
              section_name,
              courses (
                course_code,
                title,
                credit_hours
              )
            )
          `)
          .eq('student_id', user.id);

        if (error) throw error;
        // @ts-ignore
        setCourses(data || []);
      } catch (error) {
        console.error("Error fetching academics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAcademics();
  }, [user]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Academic_Transcript',
  });

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academics</h1>
          <p className="text-muted-foreground">View your enrolled courses and transcripts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer size={16} /> Print Transcript
          </Button>
          <Button onClick={() => window.location.href='/student/academics/registration'}>
            Register for Courses
          </Button>
        </div>
      </div>

      <div ref={componentRef} className="print:p-8">
        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="print:block">
            <div className="hidden print:block text-center mb-8 border-b-2 border-blue-900 pb-4">
               <h1 className="text-3xl font-bold text-blue-900 tracking-wider uppercase">HITEC University</h1>
               <p className="text-lg font-medium text-gray-700 mt-1">Official Academic Transcript (Unofficial Copy)</p>
               <div className="text-left mt-8 flex justify-between text-sm">
                  <div>
                    <p><span className="font-bold">Student Name:</span> {user?.firstName} {user?.lastName}</p>
                    <p><span className="font-bold">Email:</span> {user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString()}</p>
                  </div>
               </div>
            </div>
            <CardTitle>Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-gray-500 text-sm">You are not enrolled in any courses currently.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Credit Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">{reg.sections.courses.course_code}</TableCell>
                      <TableCell>{reg.sections.courses.title}</TableCell>
                      <TableCell>{reg.sections.section_name}</TableCell>
                      <TableCell>{reg.sections.courses.credit_hours}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          reg.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                          reg.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        } print:bg-transparent print:text-black`}>
                          {reg.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            <div className="hidden print:block mt-16 pt-8 border-t border-gray-300">
               <div className="flex justify-between">
                  <div className="text-center w-48">
                    <div className="border-b border-black h-8 mb-2"></div>
                    <p className="text-sm font-semibold">Student Signature</p>
                  </div>
                  <div className="text-center w-48">
                    <div className="border-b border-black h-8 mb-2"></div>
                    <p className="text-sm font-semibold">Head of Department</p>
                  </div>
               </div>
               <p className="text-xs text-center mt-8 text-gray-500">This document is electronically generated and requires a university stamp for official use.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
