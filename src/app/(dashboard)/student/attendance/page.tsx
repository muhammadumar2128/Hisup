'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import GradientStatCard from '@/components/ui/GradientStatCard';
import ProgressRing from '@/components/ui/ProgressRing';
import { CheckCircle2, XCircle, Clock, BarChart3, ChevronDown, Radio, RefreshCw } from 'lucide-react';

interface EnrolledCourse {
  section_id: string;
  section_name: string;
  course_code: string;
  course_title: string;
  credit_hours: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave';
  section_id: string;
}

export default function StudentAttendance() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch enrolled courses via API route (bypasses RLS)
  useEffect(() => {
    async function fetchCourses() {
      if (!user) return;
      setError(null);
      try {
        const response = await fetch(`/api/student/attendance?studentId=${user.id}`);
        const json = await response.json();

        if (json.error) throw new Error(json.error);

        const mapped: EnrolledCourse[] = json.courses || [];
        setCourses(mapped);

        // Auto-select first course
        if (mapped.length > 0) {
          setSelectedCourse(mapped[0]);
        }

        // If we got attendance data back for all courses, we can use it
        if (json.attendance) {
          setAttendance(json.attendance);
        }
      } catch (err: any) {
        console.error('Error fetching courses:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [user]);

  // Fetch attendance for a specific course via API route (bypasses RLS)
  const fetchAttendanceForCourse = useCallback(async (sectionId: string) => {
    if (!user) return;
    setAttendanceLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/student/attendance?studentId=${user.id}&sectionId=${sectionId}`
      );
      const json = await response.json();

      if (json.error) throw new Error(json.error);
      setAttendance(json.attendance || []);
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(err.message);
    } finally {
      setAttendanceLoading(false);
    }
  }, [user]);

  // Re-fetch attendance when selected course changes
  useEffect(() => {
    if (selectedCourse) {
      fetchAttendanceForCourse(selectedCourse.section_id);
    }
  }, [selectedCourse, fetchAttendanceForCourse]);

  // Real-time subscription for live attendance updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('student-attendance-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Live attendance update received:', payload);

          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as AttendanceRecord;
            setAttendance(prev => {
              // Only add if it belongs to the currently selected course
              if (selectedCourse && newRecord.section_id !== selectedCourse.section_id) {
                return prev;
              }
              // Avoid duplicates
              if (prev.some(r => r.id === newRecord.id)) return prev;
              return [newRecord, ...prev].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as AttendanceRecord;
            setAttendance(prev =>
              prev.map(r => (r.id === updated.id ? updated : r))
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setAttendance(prev => prev.filter(r => r.id !== deleted.id));
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsLive(false);
    };
  }, [user, selectedCourse]);

  // Manual refresh handler
  const handleRefresh = () => {
    if (selectedCourse) {
      fetchAttendanceForCourse(selectedCourse.section_id);
    }
  };

  // Stats
  const totalClasses = attendance.length;
  const presentCount = attendance.filter(r => r.status === 'Present').length;
  const absentCount = attendance.filter(r => r.status === 'Absent').length;
  const leaveCount = attendance.filter(r => r.status === 'Leave').length;
  const attendancePercent = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-72"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-48"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            My Attendance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Track your class attendance in real-time
          </p>
        </div>

        {/* Live indicator + Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={attendanceLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${attendanceLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {isLive && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Live
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl text-sm text-red-700 dark:text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Course Selector */}
      {courses.length > 0 ? (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full md:w-auto min-w-[360px] flex items-center justify-between gap-4 px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedCourse?.course_code} — {selectedCourse?.course_title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Section {selectedCourse?.section_name} • {selectedCourse?.credit_hours} Credit Hours
                </p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute z-50 mt-2 w-full md:w-auto min-w-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
              {courses.map((course) => (
                <button
                  key={course.section_id}
                  onClick={() => {
                    setSelectedCourse(course);
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${
                    selectedCourse?.section_id === course.section_id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {course.course_code} — {course.course_title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Section {course.section_name} • {course.credit_hours} CH
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Enrolled Courses</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You are not enrolled in any approved courses yet. Attendance will appear here once you are registered.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {selectedCourse && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <GradientStatCard
              title="Attendance Rate"
              value={`${attendancePercent}%`}
              subtitle={attendancePercent >= 75 ? 'Good standing' : 'Below threshold!'}
              icon={BarChart3}
              gradient={attendancePercent >= 75 ? 'emerald' : 'red'}
            />
            <GradientStatCard
              title="Total Classes"
              value={totalClasses}
              subtitle="Classes recorded"
              icon={Clock}
              gradient="blue"
            />
            <GradientStatCard
              title="Present"
              value={presentCount}
              subtitle={`${totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0}% of total`}
              icon={CheckCircle2}
              gradient="emerald"
            />
            <GradientStatCard
              title="Absent"
              value={absentCount}
              subtitle={`Leave: ${leaveCount}`}
              icon={XCircle}
              gradient={absentCount > 0 ? 'red' : 'emerald'}
            />
          </div>

          {/* Main Content: Progress Ring + Attendance Table */}
          <div className="grid gap-6 lg:grid-cols-7">
            {/* Left: Attendance Progress Ring */}
            <Card className="lg:col-span-3 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
                  <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                  Attendance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center space-y-6">
                  <ProgressRing
                    value={attendancePercent}
                    max={100}
                    size={180}
                    strokeWidth={14}
                    gradientFrom={attendancePercent >= 75 ? '#10b981' : '#ef4444'}
                    gradientTo={attendancePercent >= 75 ? '#34d399' : '#f87171'}
                    trackColor="#e2e8f0"
                    displayValue={`${attendancePercent}%`}
                    label="Attendance"
                    sublabel={`${presentCount} of ${totalClasses} classes`}
                  />

                  {/* Breakdown */}
                  <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{presentCount}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Present</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                      <p className="text-xl font-black text-red-600 dark:text-red-400">{absentCount}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Absent</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                      <p className="text-xl font-black text-amber-600 dark:text-amber-400">{leaveCount}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Leave</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  {totalClasses > 0 && (
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                      attendancePercent >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      attendancePercent >= 75 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      attendancePercent >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {attendancePercent >= 90 ? '✅ Excellent' :
                       attendancePercent >= 75 ? '👍 Good Standing' :
                       attendancePercent >= 50 ? '⚠️ At Risk' :
                       '🚨 Critical — Short Attendance'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right: Attendance Records Table */}
            <Card className="lg:col-span-4 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
                    <Clock className="mr-2 h-5 w-5 text-emerald-600" />
                    Attendance Records
                  </CardTitle>
                  {isLive && (
                    <div className="flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Updating Live
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {attendanceLoading ? (
                  <div className="p-10 text-center">
                    <div className="animate-pulse text-slate-400">Loading attendance records...</div>
                  </div>
                ) : attendance.length === 0 ? (
                  <div className="p-10 text-center">
                    <CheckCircle2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Records Yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Attendance records will appear here once your instructor marks them. Use the Refresh button to check for updates.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="font-bold">#</TableHead>
                          <TableHead className="font-bold">Date</TableHead>
                          <TableHead className="font-bold">Day</TableHead>
                          <TableHead className="text-center font-bold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map((record, idx) => {
                          const dateObj = new Date(record.date + 'T00:00:00');
                          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                          const formattedDate = dateObj.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          });
                          return (
                            <TableRow
                              key={record.id}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <TableCell className="text-xs text-slate-400 font-mono">{attendance.length - idx}</TableCell>
                              <TableCell className="font-medium text-slate-900 dark:text-white text-sm">
                                {formattedDate}
                              </TableCell>
                              <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                                {dayName}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                  record.status === 'Present'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : record.status === 'Absent'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                  {record.status === 'Present' && <CheckCircle2 className="h-3 w-3" />}
                                  {record.status === 'Absent' && <XCircle className="h-3 w-3" />}
                                  {record.status === 'Leave' && <Clock className="h-3 w-3" />}
                                  {record.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
