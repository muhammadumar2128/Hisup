'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import GradientStatCard from '@/components/ui/GradientStatCard';
import ProgressRing from '@/components/ui/ProgressRing';
import { Users, GraduationCap, Building, Banknote, TrendingUp } from 'lucide-react';
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

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899'];

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
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-60"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-40"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">System overview and graphical analytics</p>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard
          title="Total Users"
          value={totalUsers}
          subtitle="Across all portals"
          icon={Users}
          gradient="blue"
        />
        <GradientStatCard
          title="Enrolled Students"
          value={stats.students}
          subtitle="Active accounts"
          icon={GraduationCap}
          gradient="emerald"
        />
        <GradientStatCard
          title="Courses"
          value={stats.totalCourses}
          subtitle="Total catalog"
          icon={Building}
          gradient="orange"
        />
        <GradientStatCard
          title="Registrations"
          value={stats.totalEnrollments}
          subtitle="Total enrollments"
          icon={Banknote}
          gradient="purple"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Platform Distribution Chart */}
        <Card className="lg:col-span-4 flex flex-col border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
            <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
              <Users className="mr-2 h-5 w-5 text-blue-600" />
              Platform Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pt-4" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  innerRadius={55}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Academic Engagement Chart */}
        <Card className="lg:col-span-3 flex flex-col border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
            <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
              <TrendingUp className="mr-2 h-5 w-5 text-emerald-600" />
              Academic Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pt-4" style={{ height: 320 }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={academicData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
                 <YAxis tick={{ fontSize: 12 }} />
                 <Tooltip
                   contentStyle={{ 
                     borderRadius: '16px', 
                     border: 'none', 
                     boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                     fontSize: '14px',
                     fontWeight: 600,
                   }}
                 />
                 <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                 <defs>
                   <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#3b82f6" />
                     <stop offset="100%" stopColor="#6366f1" />
                   </linearGradient>
                 </defs>
               </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
