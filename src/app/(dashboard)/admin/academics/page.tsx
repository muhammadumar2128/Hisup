'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Building2, 
  BookOpen, 
  Layers, 
  GraduationCap, 
  Plus, 
  Search,
  MoreVertical,
  Settings2
} from 'lucide-react';

type Tab = 'campuses' | 'departments' | 'programs' | 'courses' | 'sections' | 'rooms' | 'schedule';

export default function AdminAcademics() {
  const [activeTab, setActiveTab] = useState<Tab>('campuses');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Entity Lists for Dropdowns
  const [campuses, setCampuses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);

  // Edit States
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<any>(null);

  // Campus State
  const [newCampusName, setNewCampusName] = useState('');
  const [newCampusLocation, setNewCampusLocation] = useState('');

  // Department State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptCampusId, setNewDeptCampusId] = useState('');

  // Program State
  const [newProgName, setNewProgName] = useState('');
  const [newProgCode, setNewProgCode] = useState('');
  const [newProgDeptId, setNewProgDeptId] = useState('');
  const [newProgCredits, setNewProgCredits] = useState('');
  const [newProgDuration, setNewProgDuration] = useState('');

  // Course State
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDeptId, setNewCourseDeptId] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState('');
  const [newCourseLectures, setNewCourseLectures] = useState('');
  const [newCourseLabs, setNewCourseLabs] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // Section State
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionCourseId, setNewSectionCourseId] = useState('');
  const [newSectionFacultyId, setNewSectionFacultyId] = useState('');
  const [newSectionCapacity, setNewSectionCapacity] = useState('50');

  // Room State
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomBuilding, setNewRoomBuilding] = useState('');
  const [newRoomCampusId, setNewRoomCampusId] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('');
  const [newRoomType, setNewRoomType] = useState('Lecture');

  // Timetable State
  const [newSchedSectionId, setNewSchedSectionId] = useState('');
  const [newSchedRoomId, setNewSchedRoomId] = useState('');
  const [newSchedDay, setNewSchedDay] = useState('Monday');
  const [newSchedStart, setNewSchedStart] = useState('');
  const [newSchedEnd, setNewSchedEnd] = useState('');

  // Expose setEditingCourse and setEditingSection to child components via window events or props.
  // We'll use window events for simplicity since tables are separate components.
  useEffect(() => {
    const handleEditCourseEvent = (e: any) => {
      const course = e.detail;
      setEditingCourse(course);
      setNewCourseCode(course.course_code);
      setNewCourseTitle(course.title);
      setNewCourseDeptId(course.department_id);
      setNewCourseCredits(course.credit_hours?.toString() || '0');
      setNewCourseLectures(course.lecture_hours?.toString() || '0');
      setNewCourseLabs(course.lab_hours?.toString() || '0');
      setShowEditModal(true);
    };
    const handleEditSectionEvent = (e: any) => {
      const sec = e.detail;
      setEditingSection(sec);
      setNewSectionCourseId(sec.course_id);
      setNewSectionName(sec.section_name);
      setNewSectionCapacity(sec.max_capacity?.toString() || '50');
      setNewSectionFacultyId(sec.faculty_id || '');
      setShowEditModal(true);
    };

    window.addEventListener('edit_course', handleEditCourseEvent);
    window.addEventListener('edit_section', handleEditSectionEvent);
    return () => {
      window.removeEventListener('edit_course', handleEditCourseEvent);
      window.removeEventListener('edit_section', handleEditSectionEvent);
    };
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    const { supabase } = await import('@/lib/supabase');
    
    const { data: campuses } = await supabase.from('campuses').select('id, name');
    setCampuses(campuses || []);

    const { data: depts } = await supabase.from('departments').select('id, name, code');
    setDepartments(depts || []);

    const { data: allCourses } = await supabase.from('courses').select('id, course_code, title');
    setCourses(allCourses || []);

    const { data: sections } = await supabase.from('sections').select(`
      id, 
      section_name, 
      courses ( course_code )
    `);
    setSections(sections || []);

    const { data: rooms } = await supabase.from('rooms').select('id, room_number, building');
    setRooms(rooms || []);

    // Fetch all users with role 'Faculty' (role_id = 2)
    const { data: facultyData } = await supabase.from('users').select(`
      id,
      profiles ( first_name, last_name )
    `).eq('role_id', 2);
    setFaculty(facultyData || []);
  };
  
  const handleAddSubmit = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      let error: any = null;

      if (activeTab === 'campuses') {
        ({ error } = await supabase.from('campuses').insert([{
          name: newCampusName,
          location: newCampusLocation
        }]));
      } else if (activeTab === 'departments') {
        ({ error } = await supabase.from('departments').insert([{
          name: newDeptName,
          code: newDeptCode,
          campus_id: newDeptCampusId
        }]));
      } else if (activeTab === 'programs') {
        ({ error } = await supabase.from('programs').insert([{
          name: newProgName,
          code: newProgCode,
          department_id: newProgDeptId,
          total_credit_hours: parseInt(newProgCredits),
          duration_years: parseFloat(newProgDuration)
        }]));
      } else if (activeTab === 'courses') {
        ({ error } = await supabase.from('courses').insert([{
          course_code: newCourseCode,
          title: newCourseTitle,
          department_id: newCourseDeptId,
          credit_hours: parseInt(newCourseCredits),
          lecture_hours: parseInt(newCourseLectures),
          lab_hours: parseInt(newCourseLabs),
          description: newCourseDesc
        }]));
      } else if (activeTab === 'sections') {
        let savedSectionId: string | null = null;
        let data: any = null;

        ({ data, error } = await supabase.from('sections').insert([{
          course_id: newSectionCourseId,
          section_name: newSectionName,
          faculty_id: null, // Insert as null first, assign via API below
          max_capacity: parseInt(newSectionCapacity),
          semester_id: '3f9a346c-aae5-47cf-9212-9d8d45e75633' 
        }]).select());

        if (!error && data && data[0] && newSectionFacultyId) {
          savedSectionId = data[0].id;
          const res = await fetch('/api/admin/assign-faculty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ facultyId: newSectionFacultyId, sectionId: savedSectionId })
          });
          if (!res.ok) {
            const errData = await res.json();
            console.error('Faculty assignment failed:', errData.error);
          }
        }
      } else if (activeTab === 'rooms') {
        ({ error } = await supabase.from('rooms').insert([{
          room_number: newRoomNumber,
          building: newRoomBuilding,
          campus_id: newRoomCampusId,
          capacity: parseInt(newRoomCapacity),
          type: newRoomType
        }]));
      } else if (activeTab === 'schedule') {
        ({ error } = await supabase.from('class_schedule').insert([{
          section_id: newSchedSectionId,
          room_id: newSchedRoomId,
          day_of_week: newSchedDay,
          start_time: newSchedStart,
          end_time: newSchedEnd
        }]));
      }

      if (error) throw error;
      
      alert(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)} added successfully!`);
      setShowAddModal(false);
      window.dispatchEvent(new Event(`refresh_${activeTab}`));
      fetchDropdownData();
      resetForm();
    } catch (err: any) {
       console.error(err);
       alert(err.message || 'Failed to save');
    }
  };

  const handleEditSubmit = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      let error: any = null;

      if (activeTab === 'courses' && editingCourse) {
        ({ error } = await supabase.from('courses').update({
          course_code: newCourseCode,
          title: newCourseTitle,
          department_id: newCourseDeptId,
          credit_hours: parseInt(newCourseCredits),
          lecture_hours: parseInt(newCourseLectures),
          lab_hours: parseInt(newCourseLabs)
        }).eq('id', editingCourse.id));
      } else if (activeTab === 'sections' && editingSection) {
        if (newSectionFacultyId) {
          // Call secure API to bypass RLS for employee profile creation
          const res = await fetch('/api/admin/assign-faculty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ facultyId: newSectionFacultyId, sectionId: editingSection.id })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to assign faculty via API');
          }
        }

        ({ error } = await supabase.from('sections').update({
          course_id: newSectionCourseId,
          section_name: newSectionName,
          // faculty_id is already handled by the API if a new one was selected, but we update it here too if it was cleared
          ...(newSectionFacultyId ? {} : { faculty_id: null }),
          max_capacity: parseInt(newSectionCapacity)
        }).eq('id', editingSection.id));
      }

      if (error) throw error;
      
      alert(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)} updated successfully!`);
      setShowEditModal(false);
      setEditingCourse(null);
      setEditingSection(null);
      window.dispatchEvent(new Event(`refresh_${activeTab}`));
      fetchDropdownData();
      resetForm();
    } catch (err: any) {
       console.error(err);
       alert(err.message || 'Failed to update');
    }
  };

  const resetForm = () => {
    setNewCampusName(''); setNewCampusLocation('');
    setNewDeptName(''); setNewDeptCode(''); setNewDeptCampusId('');
    setNewProgName(''); setNewProgCode(''); setNewProgDeptId(''); setNewProgCredits(''); setNewProgDuration('');
    setNewCourseCode(''); setNewCourseTitle(''); setNewCourseDeptId(''); setNewCourseCredits(''); setNewCourseLectures(''); setNewCourseLabs(''); setNewCourseDesc('');
    setNewSectionName(''); setNewSectionCourseId(''); setNewSectionFacultyId(''); setNewSectionCapacity('50');
    setNewRoomNumber(''); setNewRoomBuilding(''); setNewRoomCampusId(''); setNewRoomCapacity(''); setNewRoomType('Lecture');
    setNewSchedSectionId(''); setNewSchedRoomId(''); setNewSchedDay('Monday'); setNewSchedStart(''); setNewSchedEnd('');
  };

  const tabs = [
    { id: 'campuses', label: 'Campuses', icon: Building2 },
    { id: 'departments', label: 'Departments', icon: Layers },
    { id: 'programs', label: 'Programs', icon: GraduationCap },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'sections', label: 'Sections', icon: Layers },
    { id: 'rooms', label: 'Rooms', icon: Building2 },
    { id: 'schedule', label: 'Timetable', icon: Settings2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Setup</h1>
          <p className="text-muted-foreground">Manage the university structure and course catalog.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
        </Button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-md shadow-2xl my-8">
            <CardHeader className="border-b pb-4">
              <CardTitle>Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {activeTab === 'campuses' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Campus Name</label>
                    <Input placeholder="e.g. Main Campus" value={newCampusName} onChange={(e) => setNewCampusName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Location</label>
                    <Input placeholder="e.g. Taxila, Cantt" value={newCampusLocation} onChange={(e) => setNewCampusLocation(e.target.value)} />
                  </div>
                </>
              )}

              {activeTab === 'departments' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Department Name</label>
                    <Input placeholder="e.g. Computer Science" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Code</label>
                      <Input placeholder="e.g. CS" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Campus</label>
                      <select 
                        className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={newDeptCampusId}
                        onChange={(e) => setNewDeptCampusId(e.target.value)}
                      >
                        <option value="">Select Campus...</option>
                        {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'programs' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Program Name</label>
                    <Input placeholder="e.g. BS Computer Science" value={newProgName} onChange={(e) => setNewProgName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Code</label>
                      <Input placeholder="e.g. BSCS" value={newProgCode} onChange={(e) => setNewProgCode(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Department</label>
                      <select 
                        className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={newProgDeptId}
                        onChange={(e) => setNewProgDeptId(e.target.value)}
                      >
                        <option value="">Select Dept...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Credit Hours</label>
                      <Input type="number" value={newProgCredits} onChange={(e) => setNewProgCredits(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Duration (Years)</label>
                      <Input type="number" step="0.5" value={newProgDuration} onChange={(e) => setNewProgDuration(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'courses' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Course Code</label>
                      <Input placeholder="e.g. CS-101" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Department</label>
                      <select 
                        className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={newCourseDeptId}
                        onChange={(e) => setNewCourseDeptId(e.target.value)}
                      >
                        <option value="">Select Dept...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Course Title</label>
                    <Input placeholder="e.g. Intro to Programming" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500">Credits</label>
                      <Input type="number" value={newCourseCredits} onChange={(e) => setNewCourseCredits(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500">Lec Hrs</label>
                      <Input type="number" value={newCourseLectures} onChange={(e) => setNewCourseLectures(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500">Lab Hrs</label>
                      <Input type="number" value={newCourseLabs} onChange={(e) => setNewCourseLabs(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'sections' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Course</label>
                    <select 
                      className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                      value={newSectionCourseId}
                      onChange={(e) => setNewSectionCourseId(e.target.value)}
                    >
                      <option value="">Select Course...</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.title}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Section Name</label>
                      <Input placeholder="e.g. A" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Max Capacity</label>
                      <Input type="number" value={newSectionCapacity} onChange={(e) => setNewSectionCapacity(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Assign Faculty (Optional)</label>
                    <select 
                      className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                      value={newSectionFacultyId}
                      onChange={(e) => setNewSectionFacultyId(e.target.value)}
                    >
                      <option value="">No Faculty Assigned</option>
                      {faculty.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.profiles?.first_name} {f.profiles?.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'rooms' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Room Number</label>
                      <Input placeholder="e.g. 304" value={newRoomNumber} onChange={(e) => setNewRoomNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Campus</label>
                      <select 
                        className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={newRoomCampusId}
                        onChange={(e) => setNewRoomCampusId(e.target.value)}
                      >
                        <option value="">Select Campus...</option>
                        {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Building</label>
                      <Input placeholder="e.g. Block B" value={newRoomBuilding} onChange={(e) => setNewRoomBuilding(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Type</label>
                      <select 
                        className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={newRoomType}
                        onChange={(e) => setNewRoomType(e.target.value)}
                      >
                        <option value="Lecture">Lecture Hall</option>
                        <option value="Lab">Lab</option>
                        <option value="Office">Office</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Capacity</label>
                    <Input type="number" placeholder="e.g. 50" value={newRoomCapacity} onChange={(e) => setNewRoomCapacity(e.target.value)} />
                  </div>
                </>
              )}

              {activeTab === 'schedule' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Section</label>
                    <select 
                      className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                      value={newSchedSectionId}
                      onChange={(e) => setNewSchedSectionId(e.target.value)}
                    >
                      <option value="">Select Section...</option>
                      {sections.map(s => <option key={s.id} value={s.id}>{s.courses?.course_code} - {s.section_name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Room</label>
                      <select 
                        className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={newSchedRoomId}
                        onChange={(e) => setNewSchedRoomId(e.target.value)}
                      >
                        <option value="">Select Room...</option>
                        {rooms.map(r => <option key={r.id} value={r.id}>{r.room_number} ({r.building})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Day</label>
                      <select 
                        className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={newSchedDay}
                        onChange={(e) => setNewSchedDay(e.target.value)}
                      >
                        <option>Monday</option>
                        <option>Tuesday</option>
                        <option>Wednesday</option>
                        <option>Thursday</option>
                        <option>Friday</option>
                        <option>Saturday</option>
                        <option>Sunday</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Start Time</label>
                      <Input type="time" value={newSchedStart} onChange={(e) => setNewSchedStart(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">End Time</label>
                      <Input type="time" value={newSchedEnd} onChange={(e) => setNewSchedEnd(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
              
               <div className="flex space-x-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleAddSubmit}>Save</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-md shadow-2xl my-8">
            <CardHeader className="border-b pb-4">
              <CardTitle>Edit {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {activeTab === 'courses' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Course Code</label>
                      <Input placeholder="e.g. CS-101" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Department</label>
                      <select 
                        className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={newCourseDeptId}
                        onChange={(e) => setNewCourseDeptId(e.target.value)}
                      >
                        <option value="">Select Dept...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Course Title</label>
                    <Input placeholder="e.g. Intro to Programming" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500">Credits</label>
                      <Input type="number" value={newCourseCredits} onChange={(e) => setNewCourseCredits(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500">Lec Hrs</label>
                      <Input type="number" value={newCourseLectures} onChange={(e) => setNewCourseLectures(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500">Lab Hrs</label>
                      <Input type="number" value={newCourseLabs} onChange={(e) => setNewCourseLabs(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'sections' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Course</label>
                    <select 
                      className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                      value={newSectionCourseId}
                      onChange={(e) => setNewSectionCourseId(e.target.value)}
                    >
                      <option value="">Select Course...</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.title}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Section Name</label>
                      <Input placeholder="e.g. A" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Max Capacity</label>
                      <Input type="number" value={newSectionCapacity} onChange={(e) => setNewSectionCapacity(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Assign Faculty (Optional)</label>
                    <select 
                      className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                      value={newSectionFacultyId}
                      onChange={(e) => setNewSectionFacultyId(e.target.value)}
                    >
                      <option value="">No Faculty Assigned</option>
                      {faculty.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.profiles?.first_name} {f.profiles?.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
               <div className="flex space-x-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowEditModal(false); setEditingCourse(null); setEditingSection(null); resetForm(); }}>Cancel</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleEditSubmit}>Update</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
           <CardTitle className="text-lg">Manage {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</CardTitle>
           <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder={`Search ${activeTab}...`} className="pl-9 h-9" />
           </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'campuses' && <CampusesTable />}
          {activeTab === 'departments' && <DepartmentsTable />}
          {activeTab === 'programs' && <ProgramsTable />}
          {activeTab === 'courses' && <CoursesTable />}
          {activeTab === 'sections' && <SectionsTable />}
          {activeTab === 'rooms' && <RoomsTable />}
          {activeTab === 'schedule' && <ScheduleTable />}
        </CardContent>
      </Card>
    </div>
  );
}

function SectionsTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: res, error } = await supabase.from('sections').select(`
        *,
        courses ( course_code, title ),
        faculty_profiles (
          profiles ( first_name, last_name )
        )
      `).order('section_name');
      
      if (error) throw error;
      setData(res || []);
    } catch (error: any) { 
      console.error('Error fetching sections:', error);
      setErrorMsg(error.message || 'Failed to load sections');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete all student enrollments in this section!')) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(item => item.id !== id));
      alert('Section deleted');
    } catch (error: any) { alert(error.message); }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('refresh_sections', handleRefresh);
    return () => window.removeEventListener('refresh_sections', handleRefresh);
  }, []);

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading sections...</div>;
  if (errorMsg) return <div className="p-4 text-center text-sm text-red-500 bg-red-50 rounded-md m-4 border border-red-100">{errorMsg}</div>;

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Section</TableHead><TableHead>Faculty / Teacher</TableHead><TableHead>Capacity</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      <TableBody>
        {data.length === 0 ? (
           <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-4">No sections found.</TableCell></TableRow>
        ) : (
          data.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-blue-600">{item.courses?.course_code} - {item.courses?.title}</TableCell>
              <TableCell className="font-bold">{item.section_name}</TableCell>
              <TableCell>
                {(() => {
                  if (!item.faculty_profiles || !item.faculty_profiles.profiles) {
                    return <span className="text-red-500 font-medium italic">Unassigned</span>;
                  }
                  const p = item.faculty_profiles.profiles;
                  return `${p.first_name} ${p.last_name}`;
                })()}
              </TableCell>
              <TableCell>{item.max_capacity} Students</TableCell>
              <TableCell className="text-right relative">
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}><MoreVertical size={16}/></button>
                {activeDropdown === item.id && (
                  <div className="absolute right-8 top-10 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700 overflow-hidden text-left">
                    <button className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left" onClick={() => { setActiveDropdown(null); window.dispatchEvent(new CustomEvent('edit_section', { detail: item })); }}>Edit</button>
                    <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left" onClick={() => { setActiveDropdown(null); handleDelete(item.id); }}>Delete</button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function RoomsTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: res, error } = await supabase.from('rooms').select('*, campuses(name)').order('room_number');
      if (error) throw error;
      setData(res || []);
    } catch (error: any) { 
      console.error('Error fetching rooms:', error);
      setErrorMsg(error.message || 'Failed to load rooms');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(item => item.id !== id));
      alert('Room deleted');
    } catch (error: any) { alert(error.message); }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('refresh_rooms', handleRefresh);
    return () => window.removeEventListener('refresh_rooms', handleRefresh);
  }, []);

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading rooms...</div>;
  if (errorMsg) return <div className="p-4 text-center text-sm text-red-500 bg-red-50 rounded-md m-4 border border-red-100">{errorMsg}</div>;

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Room</TableHead><TableHead>Building</TableHead><TableHead>Type</TableHead><TableHead>Capacity</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      <TableBody>
        {data.length === 0 ? (
           <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-4">No rooms found.</TableCell></TableRow>
        ) : (
          data.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.room_number}</TableCell>
              <TableCell>{item.building} ({item.campuses?.name})</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.capacity} Seats</TableCell>
              <TableCell className="text-right relative">
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}><MoreVertical size={16}/></button>
                {activeDropdown === item.id && (
                  <div className="absolute right-8 top-10 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700 overflow-hidden text-left">
                    <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left" onClick={() => { setActiveDropdown(null); handleDelete(item.id); }}>Delete</button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function ScheduleTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: res, error } = await supabase.from('class_schedule').select(`
        *,
        sections (
          section_name,
          courses ( course_code )
        ),
        rooms ( room_number )
      `);
      if (error) throw error;
      setData(res || []);
    } catch (error: any) { 
      console.error('Error fetching schedule:', error);
      setErrorMsg(error.message || 'Failed to load schedule');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule entry?')) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('class_schedule').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(item => item.id !== id));
      alert('Schedule entry deleted');
    } catch (error: any) { alert(error.message); }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('refresh_schedule', handleRefresh);
    return () => window.removeEventListener('refresh_schedule', handleRefresh);
  }, []);

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading schedule...</div>;
  if (errorMsg) return <div className="p-4 text-center text-sm text-red-500 bg-red-50 rounded-md m-4 border border-red-100">{errorMsg}</div>;

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Room</TableHead><TableHead>Day</TableHead><TableHead>Time Slot</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      <TableBody>
        {data.length === 0 ? (
           <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-4">No schedule entries found.</TableCell></TableRow>
        ) : (
          data.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-blue-600">{item.sections?.courses?.course_code} - {item.sections?.section_name}</TableCell>
              <TableCell>{item.rooms?.room_number}</TableCell>
              <TableCell>{item.day_of_week}</TableCell>
              <TableCell>{item.start_time} - {item.end_time}</TableCell>
              <TableCell className="text-right relative">
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}><MoreVertical size={16}/></button>
                {activeDropdown === item.id && (
                  <div className="absolute right-8 top-10 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700 overflow-hidden text-left">
                    <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left" onClick={() => { setActiveDropdown(null); handleDelete(item.id); }}>Delete</button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function CampusesTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCampuses = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: campuses, error } = await supabase.from('campuses').select('*').order('name');
      if (error) throw error;
      setData(campuses || []);
    } catch (error: any) {
      console.error('Error fetching campuses:', error);
      setErrorMsg(error.message || 'Failed to load campuses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will fail if departments are linked to this campus.')) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('campuses').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(item => item.id !== id));
      alert('Campus deleted');
    } catch (error: any) {
      alert(error.message || 'Failed to delete. Make sure no other records depend on this.');
    }
  };

  useEffect(() => {
    fetchCampuses();
    const handleRefresh = () => fetchCampuses();
    window.addEventListener('refresh_campuses', handleRefresh);
    return () => window.removeEventListener('refresh_campuses', handleRefresh);
  }, []);

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading campuses...</div>;
  if (errorMsg) return <div className="p-4 text-center text-sm text-red-500 bg-red-50 rounded-md m-4 border border-red-100">{errorMsg}</div>;

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Campus Name</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      <TableBody>
        {data.length === 0 ? (
           <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-4">No campuses found.</TableCell></TableRow>
        ) : (
          data.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.location}</TableCell>
              <TableCell><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Active</span></TableCell>
              <TableCell className="text-right relative">
                 <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}><MoreVertical size={16}/></button>
                 {activeDropdown === item.id && (
                    <div className="absolute right-8 top-10 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700 overflow-hidden text-left">
                      <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left" onClick={() => { setActiveDropdown(null); handleDelete(item.id); }}>Delete</button>
                    </div>
                 )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function DepartmentsTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: res, error } = await supabase.from('departments').select('*, campuses(name)').order('name');
      if (error) throw error;
      setData(res || []);
    } catch (error: any) { 
      console.error('Error fetching departments:', error);
      setErrorMsg(error.message || 'Failed to load departments');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(item => item.id !== id));
      alert('Department deleted');
    } catch (error: any) { alert(error.message); }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('refresh_departments', handleRefresh);
    return () => window.removeEventListener('refresh_departments', handleRefresh);
  }, []);

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading departments...</div>;
  if (errorMsg) return <div className="p-4 text-center text-sm text-red-500 bg-red-50 rounded-md m-4 border border-red-100">{errorMsg}</div>;

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Dept Name</TableHead><TableHead>Code</TableHead><TableHead>Campus</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      <TableBody>
        {data.length === 0 ? (
           <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-4">No departments found.</TableCell></TableRow>
        ) : (
          data.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.code}</TableCell>
              <TableCell>{item.campuses?.name}</TableCell>
              <TableCell className="text-right relative">
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}><MoreVertical size={16}/></button>
                {activeDropdown === item.id && (
                  <div className="absolute right-8 top-10 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700 overflow-hidden text-left">
                    <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left" onClick={() => { setActiveDropdown(null); handleDelete(item.id); }}>Delete</button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function ProgramsTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: res, error } = await supabase.from('programs').select('*, departments(name)').order('name');
      if (error) throw error;
      setData(res || []);
    } catch (error: any) { 
      console.error('Error fetching programs:', error);
      setErrorMsg(error.message || 'Failed to load programs');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(item => item.id !== id));
      alert('Program deleted');
    } catch (error: any) { alert(error.message); }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('refresh_programs', handleRefresh);
    return () => window.removeEventListener('refresh_programs', handleRefresh);
  }, []);

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading programs...</div>;
  if (errorMsg) return <div className="p-4 text-center text-sm text-red-500 bg-red-50 rounded-md m-4 border border-red-100">{errorMsg}</div>;

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Program Name</TableHead><TableHead>Code</TableHead><TableHead>Department</TableHead><TableHead>Duration</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      <TableBody>
        {data.length === 0 ? (
           <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-4">No programs found.</TableCell></TableRow>
        ) : (
          data.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.code}</TableCell>
              <TableCell>{item.departments?.name}</TableCell>
              <TableCell>{item.duration_years} Years</TableCell>
              <TableCell className="text-right relative">
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}><MoreVertical size={16}/></button>
                {activeDropdown === item.id && (
                  <div className="absolute right-8 top-10 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700 overflow-hidden text-left">
                    <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left" onClick={() => { setActiveDropdown(null); handleDelete(item.id); }}>Delete</button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function CoursesTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: res, error } = await supabase.from('courses').select('*, departments(name)').order('course_code');
      if (error) throw error;
      setData(res || []);
    } catch (error: any) { 
      console.error('Error fetching courses:', error);
      setErrorMsg(error.message || 'Failed to load courses');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(item => item.id !== id));
      alert('Course deleted');
    } catch (error: any) { alert(error.message); }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('refresh_courses', handleRefresh);
    return () => window.removeEventListener('refresh_courses', handleRefresh);
  }, []);

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading courses...</div>;
  if (errorMsg) return <div className="p-4 text-center text-sm text-red-500 bg-red-50 rounded-md m-4 border border-red-100">{errorMsg}</div>;

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Credits</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      <TableBody>
        {data.length === 0 ? (
           <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-4">No courses found.</TableCell></TableRow>
        ) : (
          data.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-bold text-blue-600">{item.course_code}</TableCell>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>{item.credit_hours}</TableCell>
              <TableCell>{item.departments?.name}</TableCell>
              <TableCell className="text-right relative">
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}><MoreVertical size={16}/></button>
                {activeDropdown === item.id && (
                  <div className="absolute right-8 top-10 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700 overflow-hidden text-left">
                    <button className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left" onClick={() => { setActiveDropdown(null); window.dispatchEvent(new CustomEvent('edit_course', { detail: item })); }}>Edit</button>
                    <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left" onClick={() => { setActiveDropdown(null); handleDelete(item.id); }}>Delete</button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
