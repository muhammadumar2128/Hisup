'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  CreditCard, 
  Settings, 
  Plus, 
  Search,
  DollarSign,
  PieChart,
  MoreVertical
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Tab = 'heads' | 'structures' | 'invoices';

export default function AdminFinances() {
  const [activeTab, setActiveTab] = useState<Tab>('invoices');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form States
  const [newHeadName, setNewHeadName] = useState('');
  const [newHeadDesc, setNewHeadDesc] = useState('');
  
  const [newStructProgramId, setNewStructProgramId] = useState('');
  const [newStructYear, setNewStructYear] = useState(new Date().getFullYear().toString());
  const [newStructHeadId, setNewStructHeadId] = useState('');
  const [newStructAmount, setNewStructAmount] = useState('');

  // Dropdown Data
  const [programs, setPrograms] = useState<any[]>([]);
  const [heads, setHeads] = useState<any[]>([]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    const { data: progs } = await supabase.from('programs').select('id, name, code');
    setPrograms(progs || []);
    const { data: hds } = await supabase.from('fee_heads').select('id, name');
    setHeads(hds || []);
  };

  const handleAddSubmit = async () => {
    try {
      if (activeTab === 'heads') {
        const { error } = await supabase.from('fee_heads').insert([{
          name: newHeadName,
          description: newHeadDesc
        }]);
        if (error) throw error;
        setNewHeadName(''); setNewHeadDesc('');
      } else if (activeTab === 'structures') {
        const { error } = await supabase.from('fee_structures').insert([{
          program_id: newStructProgramId,
          admission_year: newStructYear,
          fee_head_id: newStructHeadId,
          amount: parseFloat(newStructAmount)
        }]);
        if (error) throw error;
        setNewStructAmount('');
      }
      
      alert('Added successfully!');
      setShowAddModal(false);
      window.dispatchEvent(new Event(`refresh_finance_${activeTab}`));
      fetchDropdownData();
    } catch (err: any) {
      alert(err.message || 'Failed to add');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Configuration & Invoices</h1>
          <p className="text-muted-foreground">Manage fee heads, global program fee structures, and student invoices.</p>
        </div>
        {activeTab !== 'invoices' && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add {activeTab === 'heads' ? 'Fee Head' : 'Fee Structure'}
          </Button>
        )}
      </div>

      <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'invoices' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Student Invoices
        </button>
        <button
          onClick={() => setActiveTab('heads')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'heads' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Fee Heads
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'structures' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Fee Structures
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="border-b pb-4">
              <CardTitle>Add New {activeTab === 'heads' ? 'Fee Head' : 'Fee Structure'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {activeTab === 'heads' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Head Name</label>
                    <Input placeholder="e.g. Tuition Fee" value={newHeadName} onChange={(e) => setNewHeadName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Description</label>
                    <Input placeholder="Description of this fee head" value={newHeadDesc} onChange={(e) => setNewHeadDesc(e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Program</label>
                    <select 
                      className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                      value={newStructProgramId}
                      onChange={(e) => setNewStructProgramId(e.target.value)}
                    >
                      <option value="">Select Program...</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Batch Year</label>
                      <Input type="number" value={newStructYear} onChange={(e) => setNewStructYear(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500">Fee Head</label>
                      <select 
                        className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                        value={newStructHeadId}
                        onChange={(e) => setNewStructHeadId(e.target.value)}
                      >
                        <option value="">Select Head...</option>
                        {heads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Amount (PKR)</label>
                    <Input type="number" placeholder="e.g. 45000" value={newStructAmount} onChange={(e) => setNewStructAmount(e.target.value)} />
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

      <Card>
        <CardHeader className="pb-3">
           <CardTitle className="text-lg">Manage {activeTab === 'heads' ? 'Fee Heads' : activeTab === 'invoices' ? 'Student Invoices' : 'Program Fees'}</CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === 'invoices' && <StudentInvoicesTable />}
          {activeTab === 'heads' && <FeeHeadsTable />}
          {activeTab === 'structures' && <FeeStructuresTable />}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentInvoicesTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: res } = await supabase
      .from('invoices')
      .select(`
        id,
        total_amount,
        due_date,
        status,
        challan_number,
        student_profiles (
          registration_number,
          profiles (
            first_name,
            last_name
          )
        )
      `)
      .order('due_date', { ascending: false });
    
    setData(res || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setData(data.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading student invoices...</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Challan / Due Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(item => (
          <TableRow key={item.id}>
            <TableCell>
              <p className="font-bold">{item.student_profiles?.profiles?.first_name} {item.student_profiles?.profiles?.last_name}</p>
              <p className="text-xs text-gray-500">{item.student_profiles?.registration_number}</p>
            </TableCell>
            <TableCell>
              <p className="font-mono text-sm">{item.challan_number}</p>
              <p className="text-xs text-gray-500">Due: {new Date(item.due_date).toLocaleDateString()}</p>
            </TableCell>
            <TableCell className="font-medium text-gray-900 dark:text-white">
              PKR {item.total_amount?.toLocaleString()}
            </TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {item.status}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleToggleStatus(item.id, item.status)}
              >
                Mark as {item.status === 'Paid' ? 'Unpaid' : 'Paid'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {data.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6 text-gray-500">No invoices generated yet.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function FeeHeadsTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchData = async () => {
    const { data: res } = await supabase.from('fee_heads').select('*').order('name');
    setData(res || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('refresh_finance_heads', fetchData);
    return () => window.removeEventListener('refresh_finance_heads', fetchData);
  }, []);

  const handleSave = async () => {
    if (!editingItem) return;
    try {
      const { error } = await supabase.from('fee_heads').update({ name: newName, description: newDesc }).eq('id', editingItem.id);
      if (error) throw error;
      setData(data.map(item => item.id === editingItem.id ? { ...item, name: newName, description: newDesc } : item));
      setEditingItem(null);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete all structures linked to this head.')) return;
    try {
      const { error } = await supabase.from('fee_heads').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(item => item.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading fee heads...</div>;

  return (
    <>
      <Table>
        <TableHeader><TableRow><TableHead>Head Name</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {data.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-sm text-gray-500">{item.description}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setEditingItem(item);
                    setNewName(item.name);
                    setNewDesc(item.description || '');
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(item.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader className="border-b pb-4">
              <CardTitle>Edit Fee Head</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500">Fee Name</label>
                 <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500">Description</label>
                 <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
               </div>
               <div className="flex space-x-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>Cancel</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave}>Save Changes</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function FeeStructuresTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newAmount, setNewAmount] = useState<string>('');

  const fetchData = async () => {
    const { data: res } = await supabase.from('fee_structures').select(`
      *,
      programs ( name, code ),
      fee_heads ( name )
    `).order('admission_year', { ascending: false });
    setData(res || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('refresh_finance_structures', fetchData);
    return () => window.removeEventListener('refresh_finance_structures', fetchData);
  }, []);

  const handleSave = async () => {
    if (!editingItem) return;
    const amountNum = parseFloat(newAmount);
    if (isNaN(amountNum)) return alert('Invalid amount');

    try {
      const { error } = await supabase.from('fee_structures').update({ amount: amountNum }).eq('id', editingItem.id);
      if (error) throw error;
      fetchData();
      setEditingItem(null);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('fee_structures').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(item => item.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading fee structures...</div>;

  return (
    <>
      <Table>
        <TableHeader><TableRow><TableHead>Program</TableHead><TableHead>Batch</TableHead><TableHead>Fee Head</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {data.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-bold">{item.programs?.name} ({item.programs?.code})</TableCell>
              <TableCell>{item.admission_year}</TableCell>
              <TableCell>{item.fee_heads?.name}</TableCell>
              <TableCell className="font-medium text-green-600">PKR {item.amount?.toLocaleString()}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setEditingItem(item);
                    setNewAmount(item.amount.toString());
                  }}
                >
                  Modify
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(item.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader className="border-b pb-4">
              <CardTitle>Modify Fee Structure</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               <div className="space-y-1">
                 <p className="font-medium">{editingItem.programs?.name} - Batch {editingItem.admission_year}</p>
                 <p className="text-xs text-gray-500">Editing: {editingItem.fee_heads?.name}</p>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500">New Amount (PKR)</label>
                 <div className="relative">
                   <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                   <Input 
                     type="number"
                     className="pl-9"
                     value={newAmount}
                     onChange={(e) => setNewAmount(e.target.value)}
                   />
                 </div>
               </div>
               <div className="flex space-x-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>Cancel</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave}>Save Changes</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
