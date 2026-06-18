'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GraduationCap, CreditCard, BookOpen, Clock } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    sgpa: 'N/A',
    cgpa: 'N/A',
    unpaidInvoices: 0,
    enrolledCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      if (!user) return;
      
      try {
        // 1. Fetch academic stats (CGPA/SGPA)
        const { data: results } = await supabase
          .from('semester_results')
          .select('sgpa, cgpa')
          .eq('student_id', user.id)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 2. Fetch unpaid invoices count
        const { count: invoicesCount } = await supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .in('status', ['Unpaid', 'Overdue']);

        // 3. Fetch enrolled courses
        const { count: coursesCount } = await supabase
          .from('course_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('status', 'Approved');

        setStats({
          sgpa: results?.sgpa ? Number(results.sgpa).toFixed(2) : 'N/A',
          cgpa: results?.cgpa ? Number(results.cgpa).toFixed(2) : 'N/A',
          unpaidInvoices: invoicesCount || 0,
          enrolledCourses: coursesCount || 0,
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
  }, [user]);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Overview of your academic progress and pending tasks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current CGPA</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cgpa}</div>
            <p className="text-xs text-muted-foreground mt-1">Latest SGPA: {stats.sgpa}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrolledCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">Current semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unpaidInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View Schedule</div>
            <p className="text-xs text-muted-foreground mt-1">Check timetable for details</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {/* Placeholder for announcements */}
               <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-semibold text-sm">Fall Semester Registration Open</h4>
                  <p className="text-xs text-gray-500 mt-1">Please register for your courses before the deadline.</p>
               </div>
               <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <h4 className="font-semibold text-sm">Library Fine Policy Update</h4>
                  <p className="text-xs text-gray-500 mt-1">Overdue book fines have been revised. Check library portal.</p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
