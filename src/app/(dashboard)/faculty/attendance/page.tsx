'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Check, X, UserMinus, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface StudentRoster {
  id: string;
  student_id: string;
  registration_number: string;
  name: string;
  attendanceStatus?: 'Present' | 'Absent' | 'Leave' | null;
}

export default function FacultyAttendance() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('sectionId');
  
  const [students, setStudents] = useState<StudentRoster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch roster and attendance for selected date
  useEffect(() => {
    async function fetchData() {
      if (!user || !sectionId) return;
      setLoading(true);
      try {
        // 1. Fetch Roster via API (to bypass RLS for student_profiles)
        const rosterResponse = await fetch(`/api/faculty/roster?sectionId=${sectionId}`);
        const rosterJson = await rosterResponse.json();
        
        if (rosterJson.error) throw new Error(rosterJson.error);
        const rosterData = rosterJson.data;

        // 2. Fetch Existing Attendance for the date
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('student_id, status')
          .eq('section_id', sectionId)
          .eq('date', date);

        if (attendanceError) throw attendanceError;

        const attendanceMap = new Map();
        attendanceData?.forEach(record => {
           attendanceMap.set(record.student_id, record.status);
        });
        
        if (!rosterData || rosterData.length === 0) {
           setStudents([]);
        } else {
           const mapped: StudentRoster[] = rosterData.map((s: any) => ({
             id: s.id,
             student_id: s.student_id,
             registration_number: s.registration_number || 'N/A',
             name: s.name,
             attendanceStatus: attendanceMap.get(s.student_id) || 'Present' // Default to Present if no history
           }));
           setStudents(mapped);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, sectionId, date]);

  // Handle Search using useMemo
  const filteredStudents = React.useMemo(() => {
     if(!searchQuery.trim()) {
       return students;
     }
     const lowerQuery = searchQuery.toLowerCase();
     return students.filter(s => 
       s.name.toLowerCase().includes(lowerQuery) || 
       s.registration_number.toLowerCase().includes(lowerQuery)
     );
  }, [searchQuery, students]);

  const updateStatus = (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, attendanceStatus: status } : s));
  };

  const bulkUpdateStatus = (status: 'Present' | 'Absent') => {
    setStudents(prev => prev.map(s => ({ ...s, attendanceStatus: status })));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      if (!user) throw new Error("User not found");
      const attendanceRecords = students.map(s => ({
        section_id: sectionId,
        student_id: s.student_id,
        date: date,
        status: s.attendanceStatus,
        marked_by: user.id
      }));

      const response = await fetch('/api/faculty/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceRecords,
          facultyId: user.id,
          sectionId
        })
      });

      const json = await response.json();
      if (json.error) throw new Error(json.error);
      
      alert("Attendance saved successfully!");
    } catch (error: any) {
      alert("Error saving attendance: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!sectionId) {
    return <div className="p-6 text-center">Invalid Section ID. Please go back to <Link href="/faculty/courses" className="text-blue-600 underline">My Courses</Link>.</div>;
  }

  const presentCount = students.filter(s => s.attendanceStatus === 'Present').length;
  const absentCount = students.filter(s => s.attendanceStatus === 'Absent').length;
  const leaveCount = students.filter(s => s.attendanceStatus === 'Leave').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/faculty/courses" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
            <p className="text-muted-foreground">Class Roster for {new Date(date).toDateString()}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <input 
             type="date" 
             value={date} 
             onChange={(e) => setDate(e.target.value)}
             className="h-10 px-3 py-2 border rounded-md dark:bg-gray-950 dark:border-gray-700 text-sm font-medium"
           />
           <Button onClick={handleSaveAttendance} disabled={saving} className="bg-blue-600 hover:bg-blue-700 rounded-lg">
             {saving ? 'Saving...' : 'Save Attendance'}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
         <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800/30 text-center">
            <p className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Present</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{presentCount}</p>
         </div>
         <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800/30 text-center">
            <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Absent</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{absentCount}</p>
         </div>
         <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leave</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{leaveCount}</p>
         </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                 placeholder="Search student by name or reg no..."
                 className="pl-9 rounded-xl bg-white dark:bg-gray-950 border-gray-200"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <div className="flex bg-gray-200/50 dark:bg-gray-800 p-1 rounded-xl">
             <Button variant="ghost" size="sm" onClick={() => bulkUpdateStatus('Present')} className="text-xs h-8 px-3 rounded-lg hover:bg-white dark:hover:bg-gray-700">All Present</Button>
             <Button variant="ghost" size="sm" onClick={() => bulkUpdateStatus('Absent')} className="text-xs h-8 px-3 rounded-lg hover:bg-white dark:hover:bg-gray-700">All Absent</Button>
           </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
             <div className="p-10 text-center animate-pulse text-gray-400">Loading roster...</div>
          ) : filteredStudents.length === 0 ? (
             <div className="p-10 text-center text-gray-500">No students found.</div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="w-[200px] font-semibold">Registration Number</TableHead>
                  <TableHead className="font-semibold">Student Name</TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student: any) => (
                  <TableRow key={student.student_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <TableCell className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{student.registration_number}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => updateStatus(student.student_id, 'Present')}
                          className={`p-2 rounded-xl border transition-all ${student.attendanceStatus === 'Present' ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200 dark:shadow-none' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/30'}`}
                          title="Present"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => updateStatus(student.student_id, 'Absent')}
                          className={`p-2 rounded-xl border transition-all ${student.attendanceStatus === 'Absent' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                          title="Absent"
                        >
                          <X size={18} />
                        </button>
                        <button 
                          onClick={() => updateStatus(student.student_id, 'Leave')}
                          className={`p-2 rounded-xl border transition-all ${student.attendanceStatus === 'Leave' ? 'bg-gray-600 border-gray-600 text-white shadow-lg shadow-gray-200 dark:shadow-none' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                          title="Leave"
                        >
                          <UserMinus size={18} />
                        </button>
                      </div>
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
