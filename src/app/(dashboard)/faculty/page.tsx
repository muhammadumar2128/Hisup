'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, BookOpen, Clock, CalendarCheck, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
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
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>)}
      </div>
    </div>;
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
            {facultyDetail?.designation || 'Faculty'} • {facultyDetail?.departments?.name || 'Department'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
             onClick={() => window.location.href='/faculty/courses'}
             className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none rounded-xl h-11 px-6"
          >
            My Courses
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 rounded-3xl overflow-hidden group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">My Courses</CardTitle>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.activeCourses}</div>
            <p className="text-xs font-bold text-blue-600 mt-2">Active sections</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 rounded-3xl overflow-hidden group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Students</CardTitle>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalStudents}</div>
            <p className="text-xs font-bold text-emerald-600 mt-2">Enrolled students</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 rounded-3xl overflow-hidden group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Employee ID</CardTitle>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900 dark:text-white truncate">{facultyDetail?.employee_id || 'N/A'}</div>
            <p className="text-xs font-bold text-purple-600 mt-2">Personal ID</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 rounded-3xl overflow-hidden group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Contact</CardTitle>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-gray-900 dark:text-white truncate">Office Room {facultyDetail?.office_room || 'N/A'}</div>
            <p className="text-xs font-bold text-orange-600 mt-2">Building</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-md border-0 bg-white dark:bg-gray-800">
          <CardHeader className="border-b border-gray-50 dark:border-gray-700/50 pb-4">
            <CardTitle className="text-xl font-bold flex items-center">
              <CalendarCheck className="mr-2 h-5 w-5 text-blue-600" />
              Weekly Class Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[400px] overflow-y-auto">
            <div className="space-y-6">
               {sortedSchedules.length > 0 ? (
                 sortedSchedules.map((schedule, index) => {
                   const colorThemes = [
                     { textHover: 'group-hover:text-blue-600', borderHover: 'hover:border-blue-200', badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' },
                     { textHover: 'group-hover:text-emerald-600', borderHover: 'hover:border-emerald-200', badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' },
                     { textHover: 'group-hover:text-purple-600', borderHover: 'hover:border-purple-200', badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' },
                     { textHover: 'group-hover:text-orange-600', borderHover: 'hover:border-orange-200', badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' }
                   ];
                   const theme = colorThemes[index % colorThemes.length];
                   
                   return (
                     <div key={schedule.id} className="flex items-center group">
                        <div className={`w-24 text-sm font-bold text-gray-400 ${theme.textHover} transition-colors`}>
                          <div className="text-xs uppercase tracking-wider">{schedule.day_of_week.substring(0, 3)}</div>
                          <div>{formatTime(schedule.start_time)}</div>
                        </div>
                        <div className={`ml-2 flex-1 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-transparent ${theme.borderHover} transition-all cursor-pointer`}>
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {schedule.section?.courses?.title || 'Unknown Course'} ({schedule.section?.courses?.course_code || 'N/A'})
                          </h4>
                          <div className="flex items-center mt-1 text-xs text-gray-500 font-medium">
                            <span className={`${theme.badge} px-2 py-0.5 rounded-full mr-3`}>
                              Section {schedule.section?.section_name || 'N/A'}
                            </span>
                            <span>{schedule.rooms ? `Room ${schedule.rooms.room_number} | ${schedule.rooms.building}` : 'Room not assigned'}</span>
                          </div>
                        </div>
                     </div>
                   );
                 })
               ) : (
                 <div className="text-center py-8">
                    <CalendarCheck className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No classes scheduled for the week.</p>
                 </div>
               )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-md border-0 bg-white dark:bg-gray-800">
          <CardHeader className="border-b border-gray-50 dark:border-gray-700/50 pb-4">
            <CardTitle className="text-xl font-bold flex items-center">
              <ShieldCheck className="mr-2 h-5 w-5 text-orange-600" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              {[
                { text: 'Marked attendance for Section A', time: '2 hours ago', icon: CheckCircle2, color: 'text-emerald-600' },
                { text: 'Uploaded Midterm Quiz results', time: '5 hours ago', icon: BookOpen, color: 'text-blue-600' },
                { text: 'Scheduled extra class for CS-305', time: 'Yesterday', icon: Clock, color: 'text-purple-600' }
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <item.icon className={`h-5 w-5 ${item.color} mt-0.5`} />
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.text}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-blue-600 hover:text-blue-700 font-bold text-sm">
              View All Activities
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
