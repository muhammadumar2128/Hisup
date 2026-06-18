'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AssessmentComponent {
  id: string;
  component_name: string;
  max_marks: number;
  weightage: number;
}

interface StudentMark {
  student_id: string;
  student_name: string;
  registration_number: string;
  obtained_marks: number;
  id?: string; // mark record id
}

export default function FacultyGrading() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('sectionId');
  
  const [components, setComponents] = useState<AssessmentComponent[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New Assessment Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newComp, setNewComp] = useState({
    component_name: 'Quiz',
    max_marks: 10,
    weightage: 5
  });

  const fetchComponents = async () => {
    if (!sectionId) return;
    const { data, error } = await supabase
      .from('assessment_components')
      .select('*')
      .eq('section_id', sectionId);
    if (!error) {
      setComponents(data || []);
      if (data && data.length > 0 && !selectedCompId) setSelectedCompId(data[0].id);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!user || !sectionId) return;
      
      try {
        // 1. Fetch Components
        await fetchComponents();

        // 2. Fetch Roster
        const rosterResponse = await fetch(`/api/faculty/roster?sectionId=${sectionId}`);
        const rosterJson = await rosterResponse.json();
        
        if (rosterJson.error) throw new Error(rosterJson.error);
        const rosterData = rosterJson.data;

        const initialMarks = (rosterData || []).map((r: any) => ({
          student_id: r.student_id,
          student_name: r.name,
          registration_number: r.registration_number || 'N/A',
          obtained_marks: 0
        }));
        setMarks(initialMarks);

      } catch (err) {
        console.error("Error fetching grading data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, sectionId]);

  const handleCreateComponent = async () => {
    if (!newComp.component_name || !sectionId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('assessment_components')
        .insert([{
          ...newComp,
          section_id: sectionId
        }])
        .select();

      if (error) throw error;
      
      await fetchComponents();
      if (data && data[0]) setSelectedCompId(data[0].id);
      setShowCreateModal(false);
      setNewComp({ component_name: 'Quiz', max_marks: 10, weightage: 5 });
      alert("Assessment created successfully!");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Fetch Marks for Selected Component
  useEffect(() => {
    if (!selectedCompId) return;

    async function fetchMarks() {
      const { data, error } = await supabase
        .from('student_marks')
        .select('*')
        .eq('assessment_component_id', selectedCompId);

      if (!error && data) {
        setMarks(prev => prev.map(m => {
          const existing = data.find(d => d.student_id === m.student_id);
          return existing ? { ...m, obtained_marks: existing.obtained_marks, id: existing.id } : { ...m, obtained_marks: 0, id: undefined };
        }));
      }
    }
    fetchMarks();
  }, [selectedCompId]);

  const updateMark = (studentId: string, value: string) => {
    const num = parseFloat(value) || 0;
    setMarks(prev => prev.map(m => m.student_id === studentId ? { ...m, obtained_marks: num } : m));
  };

  const handleSaveMarks = async () => {
    if (!selectedCompId) return;
    setSaving(true);
    try {
      const records = marks.map(m => ({
        assessment_component_id: selectedCompId,
        student_id: m.student_id,
        obtained_marks: m.obtained_marks
      }));

      const { error } = await supabase.from('student_marks').upsert(records, {
        onConflict: 'assessment_component_id,student_id'
      });
      
      if (error) throw error;
      alert("Marks saved successfully!");
    } catch (error: any) {
      alert("Error saving marks: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Chart Data: Frequency Distribution
  const chartData = useMemo(() => {
    const bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const dist = bins.map(b => ({ range: `${b}-${b+10}`, count: 0 }));
    
    marks.forEach(m => {
      const binIdx = Math.min(Math.floor(m.obtained_marks / 10), 9);
      dist[binIdx].count++;
    });
    return dist;
  }, [marks]);

  const activeComp = components.find(c => c.id === selectedCompId);

  const stats = useMemo(() => {
    if (marks.length === 0) return { avg: 0, max: 0, min: 0, stdDev: 0, passRate: 0 };
    const validMarks = marks.map(m => m.obtained_marks);
    const avg = validMarks.reduce((a, b) => a + b, 0) / marks.length;
    
    // Standard Deviation
    const squareDiffs = validMarks.map(m => Math.pow(m - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Pass Rate (assuming 50% is pass)
    const passCount = validMarks.filter(m => m >= (activeComp?.max_marks || 100) * 0.5).length;
    const passRate = (passCount / marks.length) * 100;

    return {
      avg: avg.toFixed(1),
      max: Math.max(...validMarks),
      min: Math.min(...validMarks),
      stdDev: stdDev.toFixed(1),
      passRate: passRate.toFixed(0)
    };
  }, [marks, activeComp]);

  if (!sectionId) {
    return <div className="p-6 text-center">Invalid Section ID. Please go back to <Link href="/faculty/courses" className="text-blue-600 underline">My Courses</Link>.</div>;
  }

  if (loading) {
    return <div className="animate-pulse space-y-4 p-6"><div className="h-10 bg-gray-200 rounded w-1/4"></div><div className="h-64 bg-gray-200 rounded-lg"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/faculty/courses" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Grade Entry</h1>
            <p className="text-muted-foreground">Manage assessment results and view performance analytics.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl"
            onClick={() => setShowCreateModal(true)}
          >
            Add Assessment
          </Button>
          <select 
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="h-10 px-3 py-2 border rounded-xl dark:bg-gray-950 dark:border-gray-700 font-semibold text-blue-600"
          >
            {components.length === 0 && <option value="">No Assessments</option>}
            {components.map(c => (
              <option key={c.id} value={c.id}>{c.component_name} (Max: {c.max_marks})</option>
            ))}
          </select>
          <Button onClick={handleSaveMarks} disabled={saving || !selectedCompId} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6">
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <CardHeader>
              <CardTitle>Create New Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">Assessment Type</label>
                <select 
                  className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                  value={newComp.component_name}
                  onChange={(e) => setNewComp({...newComp, component_name: e.target.value})}
                >
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Project">Project</option>
                  <option value="Final">Final Exam</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Max Marks</label>
                  <Input 
                    type="number"
                    value={newComp.max_marks}
                    onChange={(e) => setNewComp({...newComp, max_marks: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Weightage (%)</label>
                  <Input 
                    type="number"
                    value={newComp.weightage}
                    onChange={(e) => setNewComp({...newComp, weightage: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-blue-600" onClick={handleCreateComponent} disabled={saving}>
                   {saving ? 'Creating...' : 'Create Assessment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Class Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-blue-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500">Average</p>
                  <p className="text-xl font-bold text-blue-600">{stats.avg}</p>
               </div>
               <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-blue-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500">Highest</p>
                  <p className="text-xl font-bold text-green-600">{stats.max}</p>
               </div>
               <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-blue-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500">Std Dev</p>
                  <p className="text-xl font-bold text-purple-600">{stats.stdDev}</p>
               </div>
               <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-blue-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500">Pass Rate</p>
                  <p className="text-xl font-bold text-orange-600">{stats.passRate}%</p>
               </div>
            </div>
            
            <div className="mt-6 h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="range" fontSize={10} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#3b82f6' : '#f3f4f6'} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-2">Score Distribution (Bell Curve Visualization)</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-2xl border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-900">
          <CardHeader className="border-b border-gray-50 dark:border-gray-800 pb-4">
             <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  Student Marks Roster
                </CardTitle>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                   Total: {marks.length} Students
                </span>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="font-semibold">Reg. Number</TableHead>
                  <TableHead className="font-semibold">Student Name</TableHead>
                  <TableHead className="text-right font-semibold">Marks (Out of {activeComp?.max_marks || 100})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.map((m) => (
                  <TableRow key={m.student_id} className="hover:bg-blue-50/30 dark:hover:bg-gray-800/50 group">
                    <TableCell className="font-mono text-sm text-blue-600 font-bold">{m.registration_number}</TableCell>
                    <TableCell className="font-medium">{m.student_name}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={activeComp?.max_marks || 100}
                        value={m.obtained_marks === 0 ? '' : m.obtained_marks}
                        placeholder="0"
                        onChange={(e) => updateMark(m.student_id, e.target.value)}
                        className="w-24 ml-auto text-right font-bold focus:ring-2 focus:ring-blue-500 rounded-lg h-9 border-gray-200"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
