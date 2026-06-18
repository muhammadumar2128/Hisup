'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Clock, User, BookOpen } from 'lucide-react';

interface RegistrationRequest {
  id: string;
  status: string;
  registration_date: string;
  student_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  sections: {
    section_name: string;
    courses: {
      course_code: string;
      title: string;
    }
  }
}

export default function AdminRegistrations() {
  const [requests, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('course_registrations')
        .select(`
          id,
          status,
          registration_date,
          student_id,
          profiles!inner (
            first_name,
            last_name
          ),
          sections!inner (
            section_name,
            courses!inner (
              course_code,
              title
            )
          )
        `)
        .eq('status', 'Pending')
        .order('registration_date', { ascending: false });

      if (error) throw error;
      setRegistrations(data as any || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: 'Approved' | 'Dropped') => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('course_registrations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh list
      setRegistrations(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update status.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="animate-pulse p-6 space-y-4"><div className="h-12 bg-gray-200 rounded w-1/4"></div><div className="h-64 bg-gray-200 rounded"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Registration Requests</h1>
          <p className="text-muted-foreground text-sm">Review and approve pending student course enrollments.</p>
        </div>
        <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-1.5 rounded-full border border-yellow-200 dark:border-yellow-800">
           <Clock size={16} className="text-yellow-600" />
           <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
             {requests.length} Pending
           </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approval Queue</CardTitle>
          <CardDescription>Courses listed here require administrative confirmation before appearing in student portals.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
               <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <CheckCircle className="text-gray-400" />
               </div>
               <h3 className="font-semibold text-gray-900 dark:text-white">No Pending Requests</h3>
               <p className="text-sm text-gray-500 mt-1">All student registrations have been processed.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                         <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                            {req.profiles.first_name[0]}{req.profiles.last_name[0]}
                         </div>
                         <div>
                            <p className="text-sm font-semibold">{req.profiles.first_name} {req.profiles.last_name}</p>
                            <p className="text-[10px] text-gray-500 font-mono">ID: {req.student_id.substring(0, 8)}</p>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{req.sections.courses.title}</p>
                      <p className="text-xs text-blue-600 font-bold">{req.sections.courses.course_code}</p>
                    </TableCell>
                    <TableCell>
                       <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-bold border">
                          Section {req.sections.section_name}
                       </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                       {new Date(req.registration_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(req.id, 'Dropped')}
                            disabled={processingId === req.id}
                          >
                            <XCircle size={16} className="mr-1" /> Deny
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusUpdate(req.id, 'Approved')}
                            disabled={processingId === req.id}
                          >
                            <CheckCircle size={16} className="mr-1" /> Approve
                          </Button>
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
