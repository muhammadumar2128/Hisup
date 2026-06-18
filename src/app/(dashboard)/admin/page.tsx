'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, GraduationCap, Building, Banknote } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardStats {
  students: number;
  faculty: number;
  admin: number;
  librarian: number;
  finance: number;
  totalCourses: number;
  totalEnrollments: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Fetch User Distribution from profiles/users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('role_id');

        if (usersError) throw usersError;

        let students = 0, faculty = 0, admin = 0, librarian = 0, finance = 0;
        if (usersData) {
           usersData.forEach((u: any) => {
             if (u.role_id === 3) students++;
             else if (u.role_id === 2) faculty++;
             else if (u.role_id === 1) admin++;
             else if (u.role_id === 4) librarian++;
             else if (u.role_id === 5) finance++;
           });
        }

        // 2. Fetch Course Stats
        const { count: coursesCount } = await supabase.from('courses').select('id', { count: 'exact', head: true });
        const { count: enrollmentsCount } = await supabase.from('course_registrations').select('id', { count: 'exact', head: true });

        setStats({
          students,
          faculty,
          admin,
          librarian,
          finance,
          totalCourses: coursesCount || 0,
          totalEnrollments: enrollmentsCount || 0,
        });

      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading || !stats) {
     return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded-lg"></div><div className="h-64 bg-gray-200 rounded-lg"></div></div>;
  }

  const roleData = [
    { name: 'Students', value: stats.students },
    { name: 'Faculty', value: stats.faculty },
    { name: 'Admins', value: stats.admin },
    { name: 'Librarians', value: stats.librarian },
    { name: 'Finance', value: stats.finance },
  ].filter(d => d.value > 0);

  const academicData = [
    { name: 'Active Courses', value: stats.totalCourses },
    { name: 'Enrollments', value: stats.totalEnrollments },
  ];

  const totalUsers = stats.students + stats.faculty + stats.admin + stats.librarian + stats.finance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and graphical analytics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all portals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
            <p className="text-xs text-muted-foreground mt-1">Active Accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <Building className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
            <Banknote className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Enrollments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 h-96 flex flex-col">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 h-96 flex flex-col">
          <CardHeader>
            <CardTitle>Academic Engagement</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={academicData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" />
                 <YAxis />
                 <Tooltip />
                 <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
