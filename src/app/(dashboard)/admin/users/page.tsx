'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  ShieldCheck, 
  UserCircle,
  XCircle,
  CheckCircle2
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role_name: string;
  first_name: string;
  last_name: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  created_at: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [creatingUser, setCreatingUser] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // New User Form State
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Student',
    programId: '',
    employeeId: '',
    designation: 'Lecturer',
    dob: '',
    gender: 'Male',
    phone: '',
    specialization: '',
    departmentId: '',
    officeRoom: ''
  });

  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          status,
          created_at,
          roles ( role_name ),
          profiles ( first_name, last_name )
        `);

      if (error) throw error;
      
      const mapped: UserData[] = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email || '',
        status: u.status || 'Inactive',
        created_at: new Date(u.created_at).toLocaleDateString() || '',
        role_name: u.roles?.role_name || 'Unknown',
        first_name: u.profiles?.first_name || 'N/A',
        last_name: u.profiles?.last_name || ''
      }));
      
      setUsers(mapped);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const { data: pData } = await supabase.from('programs').select('id, name');
      if (pData) setPrograms(pData);
      
      const { data: dData } = await supabase.from('departments').select('id, name');
      if (dData) setDepartments(dData);
    }
    fetchData();
    fetchUsers();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.addEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.role) {
      alert("Email, password, and role are required.");
      return;
    }
    
    setCreatingUser(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser)
      });
      
      const json = await response.json();
      if (json.error) throw new Error(json.error);
      
      alert(`User ${newUser.email} created successfully!`);
      setShowAddModal(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'Student',
        programId: '',
        employeeId: '',
        designation: 'Lecturer',
        dob: '',
        gender: 'Male',
        phone: '',
        specialization: '',
        departmentId: '',
        officeRoom: ''
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      alert("Failed to create user: " + error.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const roleMap: Record<string, number> = {
    'Admin': 1,
    'Faculty': 2,
    'Student': 3,
    'Librarian': 4,
    'Finance': 5
  };

  const handleUpdateRole = async () => {
    if (!editingUser || !newRole) return;
    try {
      const roleId = roleMap[newRole];
      const { error } = await supabase
        .from('users')
        .update({ role_id: roleId })
        .eq('id', editingUser.id);
        
      if (error) throw error;
      
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role_name: newRole } : u));
      setEditingUser(null);
      alert("User role updated successfully.");
    } catch (error: any) {
      console.error("Error updating role:", error);
      alert(error.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    try {
      const newStatus = user.status === 'Suspended' ? 'Active' : 'Suspended';
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) throw error;
      
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus as any } : u));
      alert(`User ${newStatus === 'Suspended' ? 'suspended' : 'activated'} successfully.`);
    } catch (error: any) {
      alert("Error updating status: " + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user? This will remove all their profile data.")) return;
    
    try {
      // Delete from users table (cascades to profiles and student/faculty profiles)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.filter(u => u.id !== userId));
      alert("User deleted successfully.");
    } catch (error: any) {
      alert("Error deleting user: " + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="animate-pulse space-y-4 p-6"><div className="h-8 bg-gray-200 rounded w-1/4"></div><div className="h-64 bg-gray-200 rounded-lg"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Add User Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <CardHeader className="border-b pb-4 shrink-0">
              <CardTitle>Create New Portal User</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 overflow-y-auto">
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500">Full Name</label>
                 <div className="flex gap-2">
                    <Input 
                      placeholder="First Name" 
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    />
                    <Input 
                      placeholder="Last Name" 
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500">Email Address</label>
                 <Input 
                    type="email" 
                    placeholder="user@hitecuni.edu.pk" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                 />
               </div>
               
               {/* New Shared Profile Fields */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-500">Date of Birth</label>
                   <Input 
                      type="date" 
                      value={newUser.dob}
                      onChange={(e) => setNewUser({...newUser, dob: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-500">Gender</label>
                   <select 
                      className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                      value={newUser.gender}
                      onChange={(e) => setNewUser({...newUser, gender: e.target.value})}
                   >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                   </select>
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500">Phone Number</label>
                 <Input 
                    placeholder="0300-1234567" 
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500">Temporary Password</label>
                 <Input 
                    type="password" 
                    placeholder="Temp1234!" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500">Assign Role</label>
                 <select 
                    className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                 >
                    <option value="Admin">Admin</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Student">Student</option>
                    <option value="Finance">Finance</option>
                    <option value="Librarian">Librarian</option>
                 </select>
               </div>

               {newUser.role === 'Student' && (
                 <div className="space-y-2 animate-in slide-in-from-top-2">
                   <label className="text-xs font-bold uppercase text-gray-500">Academic Program</label>
                   <select 
                      className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                      value={newUser.programId}
                      onChange={(e) => setNewUser({...newUser, programId: e.target.value})}
                   >
                      <option value="">Select Program...</option>
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                   </select>
                 </div>
               )}

               {newUser.role === 'Faculty' && (
                 <div className="space-y-4 animate-in slide-in-from-top-2">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-gray-500">Employee ID</label>
                       <Input 
                          placeholder="EMP-123" 
                          value={newUser.employeeId}
                          onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})}
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-gray-500">Designation</label>
                       <Input 
                          placeholder="e.g. Assistant Professor" 
                          value={newUser.designation}
                          onChange={(e) => setNewUser({...newUser, designation: e.target.value})}
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-gray-500">Department</label>
                       <select 
                          className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                          value={newUser.departmentId}
                          onChange={(e) => setNewUser({...newUser, departmentId: e.target.value})}
                       >
                          <option value="">Select Department...</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-gray-500">Office Room</label>
                       <Input 
                          placeholder="e.g. Block B, Room 102" 
                          value={newUser.officeRoom}
                          onChange={(e) => setNewUser({...newUser, officeRoom: e.target.value})}
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase text-gray-500">Specialization</label>
                     <Input 
                        placeholder="e.g. Artificial Intelligence, Data Science" 
                        value={newUser.specialization}
                        onChange={(e) => setNewUser({...newUser, specialization: e.target.value})}
                     />
                   </div>
                 </div>
               )}

               <div className="flex space-x-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button className="flex-1 bg-blue-600" onClick={handleCreateUser}>Create User</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader className="border-b pb-4">
              <CardTitle>Edit User Role</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               <div className="space-y-1">
                 <p className="font-medium">{editingUser.first_name} {editingUser.last_name}</p>
                 <p className="text-xs text-gray-500">{editingUser.email}</p>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500">Assign New Role</label>
                 <select 
                    className="w-full h-10 px-3 py-2 text-sm border rounded-md dark:bg-gray-900 dark:border-gray-700"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                 >
                    <option value="" disabled>Select Role...</option>
                    <option value="Admin">Admin</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Student">Student</option>
                    <option value="Finance">Finance</option>
                    <option value="Librarian">Librarian</option>
                 </select>
               </div>
               <div className="flex space-x-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>Cancel</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleUpdateRole} disabled={!newRole || newRole === editingUser.role_name}>Update Role</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system access, roles, and user status.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center space-x-2">
               <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600"><UserCircle size={20}/></div>
               <div>
                 <p className="text-xs text-gray-500 font-bold uppercase">Total Users</p>
                 <p className="text-2xl font-bold">{users.length}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center space-x-2">
               <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg text-green-600"><CheckCircle2 size={20}/></div>
               <div>
                 <p className="text-xs text-gray-500 font-bold uppercase">Active Now</p>
                 <p className="text-2xl font-bold">{users.filter(u => u.status === 'Active').length}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center space-x-2">
               <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg text-red-600"><ShieldCheck size={20}/></div>
               <div>
                 <p className="text-xs text-gray-500 font-bold uppercase">Suspended</p>
                 <p className="text-2xl font-bold">{users.filter(u => u.status === 'Suspended').length}</p>
               </div>
             </div>
           </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search users by name, email or role..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                        {(u.first_name && u.first_name.length > 0 ? u.first_name[0] : '')}{(u.last_name && u.last_name.length > 0 ? u.last_name[0] : '')}
                      </div>
                      <div>
                        <p className="font-medium">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-800">
                      {u.role_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.status === 'Active' ? 'bg-green-100 text-green-700' : 
                      u.status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                        u.status === 'Active' ? 'bg-green-600' : 
                        u.status === 'Suspended' ? 'bg-red-600' : 'bg-yellow-600'
                      }`} />
                      {u.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {u.created_at}
                  </TableCell>
                  <TableCell className="text-right relative">
                    <div className="relative inline-block" ref={activeDropdown === u.id ? dropdownRef : null}>
                      <button 
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        onClick={() => setActiveDropdown(activeDropdown === u.id ? null : u.id)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeDropdown === u.id && (
                        <div className="absolute right-8 top-1 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700 overflow-hidden text-left">
                          <button 
                            className="w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                            onClick={() => {
                              setActiveDropdown(null);
                              setEditingUser(u);
                              setNewRole(u.role_name);
                            }}
                          >
                          Edit Role
                        </button>
                        <button 
                          className="w-full px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                          onClick={() => {
                            setActiveDropdown(null);
                            handleToggleStatus(u);
                          }}
                        >
                          {u.status === 'Suspended' ? 'Activate User' : 'Suspend User'}
                        </button>
                        <button 
                          className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                          onClick={() => {
                            setActiveDropdown(null);
                            handleDeleteUser(u.id);
                          }}
                        >
                          Delete User
                        </button>
                      </div>
                    )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
