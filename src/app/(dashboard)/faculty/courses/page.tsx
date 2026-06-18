'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface Section {
  id: string;
  section_name: string;
  max_capacity: number;
  courses: {
    course_code: string;
    title: string;
  };
  semesters: {
    term: string;
    academic_year: string;
  };
}

export default function FacultyCourses() {
  const { user } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('sections')
          .select(`
            id,
            section_name,
            max_capacity,
            courses (
              course_code,
              title
            ),
            semesters (
              term,
              academic_year
            )
          `)
          .eq('faculty_id', user.id);

        if (error) throw error;
        // @ts-ignore
        setSections(data || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [user]);

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg m-6"></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground">View and manage the course sections assigned to you.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Sections</CardTitle>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-gray-500 text-sm">No courses assigned for this semester.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Title</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">{section.courses?.course_code}</TableCell>
                    <TableCell>{section.courses?.title}</TableCell>
                    <TableCell>{section.section_name}</TableCell>
                    <TableCell>{section.semesters?.term} {section.semesters?.academic_year}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => router.push(`/faculty/attendance?sectionId=${section.id}`)}
                      >
                        Attendance
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/faculty/grading?sectionId=${section.id}`)}
                      >
                        Enter Grades
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
