'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import GradientStatCard from '@/components/ui/GradientStatCard';
import ProgressRing from '@/components/ui/ProgressRing';
import { Users, BookOpen, Clock, CalendarCheck, CheckCircle2, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeCourses: 0,
    totalStudents: 0,
  });
  const [facultyDetail, setFacultyDetail] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      try {
        // Fetch active sections assigned to the faculty with course details
        const { data: sections, error } = await supabase
          .from('sections')
          .select(`
            id,
            section_name,
            course_id,
            courses (
              course_code,
              title
            ),
            course_registrations ( count )
          `)
          .eq('faculty_id', user.id);

        if (error) throw error;

        // Fetch faculty specific profile details
        const { data: facultyProfile, error: profileError } = await supabase
          .from('faculty_profiles')
          .select(`
            employee_id,
            designation,
            specialization,
            departments ( name )
          `)
          .eq('id', user.id)
          .single();

        const activeCoursesCount = sections?.length || 0;
        let totalStudentsCount = 0;
        const sectionIds: string[] = [];

        sections?.forEach(section => {
             // @ts-ignore
             totalStudentsCount += section.course_registrations[0]?.count || 0;
             sectionIds.push(section.id);
        });

        setStats({
          activeCourses: activeCoursesCount,
          totalStudents: totalStudentsCount,
        });
        
        if (facultyProfile) setFacultyDetail(facultyProfile);

        // Fetch Class Schedule for the active sections
        if (sectionIds.length > 0) {
           const { data: scheduleData, error: scheduleError } = await supabase
             .from('class_schedule')
             .select(`
                id,
                day_of_week,
                start_time,
                end_time,
                section_id,
                rooms (
                  room_number,
                  building
                )
             `)
             .in('section_id', sectionIds);

           if (scheduleError) {
             console.error("Error fetching schedules:", scheduleError);
           } else if (scheduleData) {
             // Map schedules to include section and course info
             const enrichedSchedules = scheduleData.map(schedule => {
               const section = sections.find(s => s.id === schedule.section_id);
               return {
                 ...schedule,
                 section
               };
             });
             // Sort by start_time
             enrichedSchedules.sort((a, b) => {
                if(a.start_time < b.start_time) return -1;
                if(a.start_time > b.start_time) return 1;
                return 0;
             });
             setSchedules(enrichedSchedules);
           }
        }

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-72"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-48"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  // Format time (e.g., "09:00:00" -> "09:00 AM")
  const formatTime = (timeStr: string) => {
    if(!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10));
    d.setMinutes(parseInt(minutes, 10));
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Sort schedule by day of week and time
  const dayOrder: Record<string, number> = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
  };

  const sortedSchedules = [...schedules].sort((a, b) => {
    if (dayOrder[a.day_of_week] !== dayOrder[b.day_of_week]) {
      return dayOrder[a.day_of_week] - dayOrder[b.day_of_week];
    }
    if (a.start_time < b.start_time) return -1;
    if (a.start_time > b.start_time) return 1;
    return 0;
  });

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, {user?.firstName} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {facultyDetail?.designation || 'Faculty'} • {facultyDetail?.departments?.name || 'Department'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
             onClick={() => window.location.href='/faculty/courses'}
             className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-xl h-11 px-6 font-bold inline-flex items-center"
          >
            My Courses
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard
          title="My Courses"
          value={stats.activeCourses}
          subtitle="Active sections"
          icon={BookOpen}
          gradient="blue"
        />
        <GradientStatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Enrolled students"
          icon={Users}
          gradient="emerald"
        />
        <GradientStatCard
          title="Employee ID"
          value={facultyDetail?.employee_id || 'N/A'}
          subtitle="Personal ID"
          icon={ShieldCheck}
          gradient="purple"
        />
        <GradientStatCard
          title="Department"
          value={facultyDetail?.departments?.name || 'N/A'}
          subtitle={facultyDetail?.specialization || 'Specialization'}
          icon={MapPin}
          gradient="orange"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Class Schedule */}
        <Card className="lg:col-span-4 shadow-lg border-0 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
            <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
              <CalendarCheck className="mr-2 h-5 w-5 text-blue-600" />
              Weekly Class Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[400px] overflow-y-auto">
            <div className="space-y-4">
               {sortedSchedules.length > 0 ? (
                 sortedSchedules.map((schedule, index) => {
                   const colorThemes = [
                     { textHover: 'group-hover:text-blue-600', borderHover: 'hover:border-blue-200 dark:hover:border-blue-800', badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
                     { textHover: 'group-hover:text-emerald-600', borderHover: 'hover:border-emerald-200 dark:hover:border-emerald-800', badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
                     { textHover: 'group-hover:text-purple-600', borderHover: 'hover:border-purple-200 dark:hover:border-purple-800', badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
                     { textHover: 'group-hover:text-orange-600', borderHover: 'hover:border-orange-200 dark:hover:border-orange-800', badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' }
                   ];
                   const theme = colorThemes[index % colorThemes.length];
                   
                   return (
                     <div key={schedule.id} className={`flex items-center group p-3 rounded-2xl border border-transparent ${theme.borderHover} transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                        {/* Time dot */}
                        <div className="flex flex-col items-center mr-4">
                          <div className={`w-3 h-3 rounded-full ${theme.dot} ring-4 ring-white dark:ring-slate-900`}></div>
                          {index < sortedSchedules.length - 1 && (
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mt-1"></div>
                          )}
                        </div>
                        <div className={`w-20 text-sm font-bold text-slate-400 ${theme.textHover} transition-colors flex-shrink-0`}>
                          <div className="text-[10px] uppercase tracking-wider font-extrabold">{schedule.day_of_week.substring(0, 3)}</div>
                          <div className="text-xs">{formatTime(schedule.start_time)}</div>
                        </div>
                        <div className="ml-2 flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {schedule.section?.courses?.title || 'Unknown Course'} ({schedule.section?.courses?.course_code || 'N/A'})
                          </h4>
                          <div className="flex items-center mt-1 text-xs text-slate-500 font-medium gap-2">
                            <span className={`${theme.badge} px-2 py-0.5 rounded-full text-[10px] font-bold`}>
                              Section {schedule.section?.section_name || 'N/A'}
                            </span>
                            <span>{schedule.rooms ? `Room ${schedule.rooms.room_number} | ${schedule.rooms.building}` : 'Room not assigned'}</span>
                          </div>
                        </div>
                     </div>
                   );
                 })
               ) : (
                 <div className="text-center py-12">
                    <CalendarCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No classes scheduled for the week.</p>
                 </div>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Teaching Overview + Recent Activities */}
        <div className="lg:col-span-3 space-y-6">
          {/* Teaching Performance Ring */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
              <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
                <BookOpen className="mr-2 h-5 w-5 text-emerald-600" />
                Teaching Load
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-center">
                <ProgressRing
                  value={stats.activeCourses}
                  max={6}
                  size={140}
                  strokeWidth={12}
                  gradientFrom="#10b981"
                  gradientTo="#06b6d4"
                  trackColor="#e2e8f0"
                  displayValue={String(stats.activeCourses)}
                  label="Courses"
                  sublabel={`${stats.totalStudents} total students`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
              <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
                <ShieldCheck className="mr-2 h-5 w-5 text-orange-600" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-4">
                {[
                  { text: 'Marked attendance for Section A', time: '2 hours ago', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { text: 'Uploaded Midterm Quiz results', time: '5 hours ago', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { text: 'Scheduled extra class for CS-305', time: 'Yesterday', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                    <div className={`p-2 rounded-xl ${item.bg} flex-shrink-0`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.text}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-blue-600 hover:text-blue-700 font-bold text-sm rounded-xl">
                View All Activities
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
