'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import GradientStatCard from '@/components/ui/GradientStatCard';
import ProgressRing from '@/components/ui/ProgressRing';
import { GraduationCap, CreditCard, BookOpen, Clock, ArrowRight, Calendar, Bell, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    sgpa: 'N/A',
    cgpa: 'N/A',
    cgpaNum: 0,
    unpaidInvoices: 0,
    enrolledCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

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

        const cgpaVal = results?.cgpa ? Number(results.cgpa) : 0;

        setStats({
          sgpa: results?.sgpa ? Number(results.sgpa).toFixed(2) : 'N/A',
          cgpa: results?.cgpa ? Number(results.cgpa).toFixed(2) : 'N/A',
          cgpaNum: cgpaVal,
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
    return (
      <div className="space-y-6">
        {/* Skeleton greeting */}
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-72"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-48"></div>
        </div>
        {/* Skeleton cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        {/* Skeleton bottom */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4 h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="lg:col-span-3 h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Personalized Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, {user?.firstName} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Here's your academic overview for today
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/student/academics"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
          >
            View Academics
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard
          title="Current CGPA"
          value={stats.cgpa}
          subtitle={`SGPA: ${stats.sgpa}`}
          icon={GraduationCap}
          gradient="blue"
        />
        <GradientStatCard
          title="Enrolled Courses"
          value={stats.enrolledCourses}
          subtitle="Current semester"
          icon={BookOpen}
          gradient="emerald"
        />
        <GradientStatCard
          title="Pending Invoices"
          value={stats.unpaidInvoices}
          subtitle={stats.unpaidInvoices > 0 ? 'Requires attention' : 'All clear!'}
          icon={CreditCard}
          gradient={stats.unpaidInvoices > 0 ? 'red' : 'emerald'}
        />
        <GradientStatCard
          title="Upcoming Classes"
          value="Schedule"
          subtitle="Check timetable"
          icon={Clock}
          gradient="orange"
        />
      </div>

      {/* Main Content: CGPA Ring + Announcements + Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* CGPA Progress Ring Card */}
        <Card className="lg:col-span-3 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
            <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
              Academic Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Main CGPA Ring */}
              <ProgressRing
                value={stats.cgpaNum}
                max={4}
                size={180}
                strokeWidth={14}
                gradientFrom="#3b82f6"
                gradientTo="#8b5cf6"
                trackColor="#e2e8f0"
                displayValue={stats.cgpa}
                label="CGPA"
                sublabel={`out of 4.00`}
              />

              {/* SGPA + CGPA side by side */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.sgpa}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                    Latest SGPA
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.cgpa}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                    Cumulative
                  </p>
                </div>
              </div>

              {/* Performance indicator */}
              {stats.cgpaNum > 0 && (
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                  stats.cgpaNum >= 3.5 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  stats.cgpaNum >= 3.0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  stats.cgpaNum >= 2.5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {stats.cgpaNum >= 3.5 ? '🏆 Dean\'s List' :
                   stats.cgpaNum >= 3.0 ? '⭐ Good Standing' :
                   stats.cgpaNum >= 2.5 ? '📚 Satisfactory' :
                   '⚠️ Needs Improvement'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Announcements + Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Action Tiles */}
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
              <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
                <Calendar className="mr-2 h-5 w-5 text-emerald-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 pb-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Pay Fees', href: '/student/fee', icon: CreditCard, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
                  { label: 'Schedule', href: '/student/schedule', icon: Clock, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
                  { label: 'Library', href: '/student/library', icon: BookOpen, color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
                ].map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="group flex flex-col items-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} shadow-lg ${action.shadow} mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                        <ActionIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {action.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
              <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
                <Bell className="mr-2 h-5 w-5 text-orange-600" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-4">
                {[
                  { 
                    title: 'Fall Semester Registration Open', 
                    desc: 'Please register for your courses before the deadline.',
                    time: '2 hours ago',
                    color: 'border-l-blue-500',
                    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
                    type: 'Academic'
                  },
                  { 
                    title: 'Library Fine Policy Update', 
                    desc: 'Overdue book fines have been revised. Check library portal.',
                    time: '1 day ago',
                    color: 'border-l-amber-500',
                    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
                    type: 'Notice'
                  },
                  { 
                    title: 'Mid-Term Exam Schedule Released', 
                    desc: 'Check your exam schedule in the academics section.',
                    time: '3 days ago',
                    color: 'border-l-purple-500',
                    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
                    type: 'Exam'
                  },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`border-l-4 ${item.color} pl-4 py-3 rounded-r-xl bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.badge}`}>
                        {item.type}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{item.time}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
