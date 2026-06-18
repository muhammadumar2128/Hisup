'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';

interface ScheduleEntry {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  rooms: {
    room_number: string;
    building: string;
  };
  sections: {
    section_name: string;
    courses: {
      course_code: string;
      title: string;
    }
  }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudentSchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      if (!user) return;
      
      try {
        // 1. Get sections student is enrolled in
        const { data: regData } = await supabase
          .from('course_registrations')
          .select('section_id')
          .eq('student_id', user.id)
          .eq('status', 'Approved');

        const sectionIds = (regData || []).map(r => r.section_id);

        if (sectionIds.length === 0) {
          setSchedule([]);
          return;
        }

        // 2. Get schedule for those sections
        const { data, error } = await supabase
          .from('class_schedule')
          .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            rooms ( room_number, building ),
            sections (
              section_name,
              courses ( course_code, title )
            )
          `)
          .in('section_id', sectionIds);

        if (error) throw error;
        // @ts-ignore
        setSchedule(data || []);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();
  }, [user]);

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg m-6"></div>;
  }

  const groupedSchedule = DAYS.map(day => ({
    day,
    entries: schedule.filter(s => s.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
  })).filter(d => d.entries.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Class Schedule</h1>
        <p className="text-muted-foreground">Your weekly academic timetable.</p>
      </div>

      {groupedSchedule.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center border-dashed">
           <Calendar className="h-12 w-12 text-gray-300 mb-4" />
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Classes Scheduled</h3>
           <p className="text-gray-500 max-w-xs mt-2">You don't have any approved course registrations with a defined schedule yet.</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {groupedSchedule.map((dayGroup) => (
            <div key={dayGroup.day} className="space-y-3">
               <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                 <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                 {dayGroup.day}
               </h2>
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {dayGroup.entries.map((entry) => (
                   <Card key={entry.id} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border-l-4 border-l-blue-500 overflow-hidden">
                     <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                               {entry.sections.courses.course_code}
                             </span>
                             <h4 className="font-bold text-gray-900 dark:text-white mt-1 leading-tight line-clamp-1">
                               {entry.sections.courses.title}
                             </h4>
                           </div>
                           <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                             {entry.sections.section_name}
                           </span>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                           <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-2">
                              <Clock size={14} className="text-orange-500" />
                              <span className="font-medium">
                                {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                              </span>
                           </div>
                           <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-2">
                              <MapPin size={14} className="text-green-500" />
                              <span>
                                {entry.rooms.room_number}, {entry.rooms.building}
                              </span>
                           </div>
                        </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
