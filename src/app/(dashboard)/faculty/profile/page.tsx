'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Award, 
  BookOpen,
  Camera,
  ShieldCheck
} from 'lucide-react';

interface FacultyProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cnic: string;
  avatar_url: string;
  gender: string;
  dob: string;
  current_address: string;
  permanent_address: string;
  faculty_profiles: {
    employee_id: string;
    designation: string;
    specialization: string;
    joining_date: string;
    office_room: string;
    departments: {
      name: string;
      code: string;
    };
  };
}

export default function FacultyProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<FacultyProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    currentAddress: '',
    permanentAddress: '',
    specialization: ''
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0 || !user) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      // Update local state with new avatar
      if (profile) {
        setProfile({ ...profile, avatar_url: data.avatar_url });
      }
      alert('Avatar uploaded successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            first_name,
            last_name,
            phone,
            cnic,
            avatar_url,
            gender,
            dob,
            current_address,
            permanent_address,
            users!profiles_id_fkey ( email ),
            faculty_profiles!faculty_profiles_id_fkey (
              employee_id,
              designation,
              specialization,
              joining_date,
              office_room,
              departments (
                name,
                code
              )
            )
          `)
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Supabase Error Fetching Profile:', JSON.stringify(error, null, 2));
          throw error;
        }

        // Flatten the email from users relation
        if (data) {
          const formattedData = {
            ...data,
            // @ts-ignore
            email: data.users?.email || 'N/A',
            // @ts-ignore
            faculty_profiles: Array.isArray(data.faculty_profiles) ? data.faculty_profiles[0] : (data.faculty_profiles || null)
          };
          setProfile(formattedData as any);
          setFormData({
            firstName: formattedData.first_name || '',
            lastName: formattedData.last_name || '',
            phone: formattedData.phone || '',
            currentAddress: formattedData.current_address || '',
            permanentAddress: formattedData.permanent_address || '',
            specialization: formattedData.faculty_profiles?.specialization || ''
          });
        }
      } catch (err: any) {
        console.error('Error in fetchProfile:', err.message || err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const handleUpdate = async () => {
    setUpdating(true);
    setMessage(null);
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          current_address: formData.currentAddress,
          permanent_address: formData.permanentAddress
        })
        .eq('id', user?.id);

      if (profileErr) throw profileErr;

      const { error: facultyErr } = await supabase
        .from('faculty_profiles')
        .update({
          specialization: formData.specialization
        })
        .eq('id', user?.id);

      if (facultyErr) throw facultyErr;

      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          current_address: formData.currentAddress,
          permanent_address: formData.permanentAddress,
          faculty_profiles: {
            ...prev.faculty_profiles,
            specialization: formData.specialization
          }
        };
      });

      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err: any) {
      console.error("Update error:", err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl shadow-sm border">
        <ShieldCheck className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Not Found</h2>
        <p className="text-gray-500 mt-2">We couldn't retrieve your faculty record. Please contact the administrator.</p>
      </div>
    );
  }

  const academicInfo = profile.faculty_profiles;

  return (
    <div className="space-y-8 pb-12">
      {message && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-semibold border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header Profile Section */}
      <div className="relative h-48 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>
        
        <div className="absolute -bottom-16 left-8 flex items-end space-x-6">
          <div className="relative group">
            <div className="h-32 w-32 rounded-3xl bg-white p-1 shadow-2xl">
              <div className="h-full w-full rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                ) : profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-gray-300" />
                )}
              </div>
            </div>
            <label className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform cursor-pointer">
              <Camera className="h-4 w-4" />
              <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 onChange={handleAvatarUpload} 
                 disabled={uploading}
              />
            </label>
          </div>
          
          <div className="mb-20">
            <h1 className="text-3xl font-black text-white drop-shadow-md">
              {profile.first_name} {profile.last_name}
            </h1>
            <div className="flex items-center text-blue-100 font-medium mt-1">
              <Award className="h-4 w-4 mr-1.5" />
              {academicInfo?.designation || 'Faculty Member'} • {academicInfo?.departments?.name || 'Department'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-0 shadow-md bg-white dark:bg-gray-800 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 pb-4">
              <CardTitle className="text-lg font-bold flex items-center text-gray-900 dark:text-white">
                <ShieldCheck className="mr-2 h-5 w-5 text-blue-600" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Employee ID</span>
                <span className="text-sm font-black text-blue-600">{academicInfo?.employee_id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Join Date</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {academicInfo?.joining_date ? new Date(academicInfo.joining_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Dept. Code</span>
                <span className="text-sm font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                  {academicInfo?.departments?.code || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Office Room</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{academicInfo?.office_room || 'TBD'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white dark:bg-gray-800 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 pb-4">
              <CardTitle className="text-lg font-bold flex items-center text-gray-900 dark:text-white">
                <BookOpen className="mr-2 h-5 w-5 text-emerald-600" />
                Specialization
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditing ? (
                <Input 
                  value={formData.specialization} 
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  className="bg-white dark:bg-gray-800 border border-gray-300 font-semibold focus-visible:ring-2 focus-visible:ring-blue-500" 
                  placeholder="e.g. Artificial Intelligence, Data Science"
                />
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    {academicInfo?.specialization || 'Not specified'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-0 shadow-md bg-white dark:bg-gray-800 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-gray-700/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center text-gray-900 dark:text-white">
                <User className="mr-2 h-5 w-5 text-indigo-600" />
                Personal Information
              </CardTitle>
              <Button 
                variant={isEditing ? "ghost" : "outline"} 
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    setFormData({
                      firstName: profile.first_name || '',
                      lastName: profile.last_name || '',
                      phone: profile.phone || '',
                      currentAddress: profile.current_address || '',
                      permanentAddress: profile.permanent_address || '',
                      specialization: academicInfo?.specialization || ''
                    });
                  }
                  setIsEditing(!isEditing);
                  setMessage(null);
                }}
              >
                {isEditing ? 'Cancel' : 'Edit Info'}
              </Button>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input 
                      value={isEditing ? formData.firstName : profile.first_name} 
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      readOnly={!isEditing} 
                      className={`pl-10 font-semibold ${isEditing ? "bg-white dark:bg-gray-800 border border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500" : "bg-gray-50 dark:bg-gray-900 border-0"}`} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input 
                      value={isEditing ? formData.lastName : profile.last_name} 
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      readOnly={!isEditing} 
                      className={`pl-10 font-semibold ${isEditing ? "bg-white dark:bg-gray-800 border border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500" : "bg-gray-50 dark:bg-gray-900 border-0"}`} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input value={profile.email} readOnly className="pl-10 bg-gray-50 dark:bg-gray-900 border-0 font-semibold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input 
                      value={isEditing ? formData.phone : profile.phone || 'N/A'} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      readOnly={!isEditing} 
                      className={`pl-10 font-semibold ${isEditing ? "bg-white dark:bg-gray-800 border border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500" : "bg-gray-50 dark:bg-gray-900 border-0"}`} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">CNIC / ID Card</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input value={profile.cnic || 'N/A'} readOnly className="pl-10 bg-gray-50 dark:bg-gray-900 border-0 font-semibold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Gender</Label>
                  <Input value={profile.gender || 'N/A'} readOnly className="bg-gray-50 dark:bg-gray-900 border-0 font-semibold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input 
                      value={profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'} 
                      readOnly 
                      className="pl-10 bg-gray-50 dark:bg-gray-900 border-0 font-semibold" 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white dark:bg-gray-800 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-gray-700/50 pb-4">
              <CardTitle className="text-xl font-bold flex items-center text-gray-900 dark:text-white">
                <MapPin className="mr-2 h-5 w-5 text-rose-600" />
                Contact Address
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Current Address</Label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[80px] p-3 rounded-2xl border border-gray-300 bg-white dark:bg-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-300"
                    value={formData.currentAddress}
                    onChange={(e) => setFormData({...formData, currentAddress: e.target.value})}
                  />
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl font-semibold text-gray-700 dark:text-gray-300">
                    {profile.current_address || 'Not updated'}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Permanent Address</Label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[80px] p-3 rounded-2xl border border-gray-300 bg-white dark:bg-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-300"
                    value={formData.permanentAddress}
                    onChange={(e) => setFormData({...formData, permanentAddress: e.target.value})}
                  />
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl font-semibold text-gray-700 dark:text-gray-300">
                    {profile.permanent_address || 'Not updated'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-3 pt-4">
            {isEditing ? (
              <>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      firstName: profile.first_name || '',
                      lastName: profile.last_name || '',
                      phone: profile.phone || '',
                      currentAddress: profile.current_address || '',
                      permanentAddress: profile.permanent_address || '',
                      specialization: academicInfo?.specialization || ''
                    });
                    setMessage(null);
                  }}
                  className="px-8 py-6 rounded-2xl font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl shadow-xl font-bold transition-all"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl shadow-xl font-bold transition-all hover:-translate-y-1"
              >
                Update Profile Information
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
