'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, GraduationCap, Users, BookOpen, Mail, Phone } from 'lucide-react';

interface StudentRoster {
  id: string;
  student_id: string;
  registration_number: string;
  name: string;
  phone: string;
  course_code: string;
  course_title: string;
  section_name: string;
  section_id: string;
}

export default function FacultyStudents() {
  const { user } = useAuth();
  
  const [students, setStudents] = useState<StudentRoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [sections, setSections] = useState<{id: string, name: string, course: string}[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/faculty/students?facultyId=${user.id}`);
        const json = await response.json();
        
        if (json.error) throw new Error(json.error);
        
        setSections(json.sections || []);
        
        const mappedStudents = json.data || [];
        // Sort by name
        mappedStudents.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setStudents(mappedStudents);

      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Derived state for filtering
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.registration_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSection = selectedSection === 'all' || s.section_id === selectedSection;
      return matchesSearch && matchesSection;
    });
  }, [students, searchQuery, selectedSection]);

  const uniqueStudentsCount = new Set(students.map(s => s.student_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Student Directory
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Manage and view all students enrolled in your assigned classes.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20 rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-800/50 rounded-2xl">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider">Total Students</p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{uniqueStudentsCount}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-800/50 rounded-2xl">
              <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">Total Enrollments</p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{students.length}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-purple-50 dark:bg-purple-900/20 rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-800/50 rounded-2xl">
              <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-600/80 dark:text-purple-400/80 uppercase tracking-wider">Active Sections</p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{sections.length}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-900">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                 placeholder="Search student by name or Reg No..."
                 className="pl-9 rounded-xl bg-white dark:bg-gray-950 border-gray-200"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <div className="w-full sm:w-auto">
             <select 
               className="w-full sm:w-64 h-10 px-3 py-2 text-sm border rounded-xl dark:bg-gray-950 dark:border-gray-700 font-medium"
               value={selectedSection}
               onChange={(e) => setSelectedSection(e.target.value)}
             >
               <option value="all">All Sections</option>
               {sections.map(s => (
                 <option key={s.id} value={s.id}>{s.course} - Section {s.name}</option>
               ))}
             </select>
           </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
             <div className="p-10 text-center animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
             </div>
          ) : filteredStudents.length === 0 ? (
             <div className="p-12 text-center text-gray-500">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                <p className="font-medium">No students found matching your criteria.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-500 py-4">Student Details</TableHead>
                    <TableHead className="font-semibold text-gray-500">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-500">Course & Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, idx) => (
                    <TableRow key={`${student.student_id}-${student.section_id}-${idx}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{student.name}</p>
                          <p className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">{student.registration_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                           <Phone className="h-3 w-3 mr-2 text-gray-400" />
                           {student.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{student.course_code}</p>
                          <div className="flex items-center mt-1">
                             <span className="text-xs text-gray-500 truncate max-w-[200px]">{student.course_title}</span>
                             <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                               Sec {student.section_name}
                             </span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
