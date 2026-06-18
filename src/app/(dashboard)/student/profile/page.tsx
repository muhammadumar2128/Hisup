'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { User, Phone, MapPin, CreditCard, Calendar, Mail, Shield, Info, Camera } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Editable fields state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    currentAddress: '',
    permanentAddress: ''
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
    async function fetchFullProfile() {
      if (!user) return;
      
      try {
        // 1. Fetch from 'profiles'
        const { data: pData, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (pError) throw pError;

        // 2. Fetch from 'student_profiles'
        const { data: sData } = await supabase
          .from('student_profiles')
          .select('*, programs(name)')
          .eq('id', user.id)
          .single();

        setProfile(pData);
        setStudentInfo(sData);
        
        // Initialize form data
        setFormData({
          firstName: pData?.first_name || '',
          lastName: pData?.last_name || '',
          phone: pData?.phone || '',
          currentAddress: pData?.current_address || '',
          permanentAddress: pData?.permanent_address || ''
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFullProfile();
  }, [user]);

  const handleUpdate = async () => {
    setUpdating(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          current_address: formData.currentAddress,
          permanent_address: formData.permanentAddress
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      setProfile({
        ...profile,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        current_address: formData.currentAddress,
        permanent_address: formData.permanentAddress
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err: any) {
      console.error("Update error:", err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="animate-pulse p-6 space-y-4"><div className="h-12 bg-gray-200 rounded w-1/4"></div><div className="h-64 bg-gray-200 rounded"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personal Profile</h1>
          <p className="text-muted-foreground">View and manage your official university records.</p>
        </div>
        {message && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1 ${
            message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Account Summary */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-8 text-center space-y-4">
              <div className="relative group mx-auto h-24 w-24">
                <div className="h-full w-full rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  ) : profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="h-full w-full object-cover" alt="Profile" />
                  ) : (
                    <User size={48} className="text-blue-600" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer">
                  <Camera className="h-3 w-3" />
                  <input 
                     type="file" 
                     accept="image/*" 
                     className="hidden" 
                     onChange={handleAvatarUpload} 
                     disabled={uploading}
                  />
                </label>
              </div>
              <div>
                <h3 className="text-xl font-bold">{profile?.first_name} {profile?.last_name}</h3>
                <p className="text-sm text-gray-500 font-medium">{studentInfo?.registration_number || 'Not Assigned'}</p>
              </div>
              <div className="flex justify-center space-x-2">
                 <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200">
                    {studentInfo?.enrollment_status || 'Active'}
                 </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm uppercase text-gray-500">Academic Program</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center space-x-3">
                  <Shield className="text-blue-600 h-5 w-5" />
                  <div>
                    <p className="text-xs text-gray-500">Program</p>
                    <p className="text-sm font-semibold">{studentInfo?.programs?.name || 'Academic Program Not Assigned'}</p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Fields (Direct from DB Tables) */}
        <div className="lg:col-span-2 space-y-6">
          {!studentInfo && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-800 mb-6">
              <Info className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Academic Profile Incomplete</p>
                <p className="text-xs">Your student record hasn't been fully synchronized. Please contact the Admin to assign your Program and Semester.</p>
              </div>
            </div>
          )}
          <Card>
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle>Official Identity & Contact</CardTitle>
                <CardDescription>Verified information from your registration documents.</CardDescription>
              </div>
              <Button 
                variant={isEditing ? "ghost" : "outline"} 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit Info'}
              </Button>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <Label>First Name</Label>
                 <Input 
                   value={isEditing ? formData.firstName : profile?.first_name} 
                   onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                   readOnly={!isEditing} 
                   className={isEditing ? "bg-white" : "bg-gray-50"}
                 />
               </div>

               <div className="space-y-2">
                 <Label>Last Name</Label>
                 <Input 
                   value={isEditing ? formData.lastName : profile?.last_name} 
                   onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                   readOnly={!isEditing} 
                   className={isEditing ? "bg-white" : "bg-gray-50"}
                 />
               </div>

               <div className="space-y-2">
                 <Label>CNIC / National ID</Label>
                 <div className="relative">
                   <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                   <Input value={profile?.cnic || 'N/A'} className="pl-10 bg-gray-50" readOnly />
                 </div>
                 <p className="text-[10px] text-gray-400 italic">* Contact Admin to update CNIC</p>
               </div>

               <div className="space-y-2">
                 <Label>Mobile Phone</Label>
                 <div className="relative">
                   <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                   <Input 
                     value={isEditing ? formData.phone : profile?.phone || 'N/A'} 
                     onChange={(e) => setFormData({...formData, phone: e.target.value})}
                     className={isEditing ? "pl-10 bg-white" : "pl-10 bg-gray-50"}
                     readOnly={!isEditing}
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <Label>Gender</Label>
                 <Input value={profile?.gender || 'N/A'} className="bg-gray-50" readOnly />
               </div>

               <div className="space-y-2">
                 <Label>Date of Birth</Label>
                 <div className="relative">
                   <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                   <Input value={profile?.dob || 'N/A'} className="pl-10 bg-gray-50" readOnly />
                 </div>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
               <div className="space-y-2">
                 <Label className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> Current Mailing Address</Label>
                 <textarea 
                   className={`w-full min-h-[80px] p-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                     isEditing ? "border-blue-300 bg-white" : "border-gray-200 bg-gray-50"
                   }`}
                   value={isEditing ? formData.currentAddress : profile?.current_address || 'Address not updated in records.'} 
                   onChange={(e) => setFormData({...formData, currentAddress: e.target.value})}
                   readOnly={!isEditing} 
                 />
               </div>
               <div className="space-y-2">
                 <Label className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> Permanent Home Address</Label>
                 <textarea 
                   className={`w-full min-h-[80px] p-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                     isEditing ? "border-blue-300 bg-white" : "border-gray-200 bg-gray-50"
                   }`}
                   value={isEditing ? formData.permanentAddress : profile?.permanent_address || 'Address not updated in records.'} 
                   onChange={(e) => setFormData({...formData, permanentAddress: e.target.value})}
                   readOnly={!isEditing} 
                 />
               </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-3">
             <Button variant="outline">Print Info</Button>
             {isEditing && (
               <Button 
                 className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]" 
                 onClick={handleUpdate}
                 disabled={updating}
               >
                 {updating ? 'Saving...' : 'Save Changes'}
               </Button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
