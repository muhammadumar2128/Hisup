'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Camera,
  ShieldCheck,
  Library,
  X
} from 'lucide-react';

interface LibrarianProfileData {
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
}

export default function LibrarianProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<LibrarianProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    current_address: '',
    permanent_address: ''
  });

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
            users!profiles_id_fkey ( email )
          `)
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Supabase Error Fetching Profile:', JSON.stringify(error, null, 2));
          throw error;
        }

        if (data) {
          const formattedData = {
            ...data,
            // @ts-ignore
            email: data.users?.email || 'N/A',
          };
          setProfile(formattedData as any);
        }
      } catch (err: any) {
        console.error('Error in fetchProfile:', err.message || err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const openEditModal = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        current_address: profile.current_address || '',
        permanent_address: profile.permanent_address || ''
      });
      setIsEditing(true);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          current_address: formData.current_address,
          permanent_address: formData.permanent_address
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile: ' + err.message);
    } finally {
      setIsSubmitting(false);
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
        <p className="text-gray-500 mt-2">We couldn't retrieve your profile record. Please contact the administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 relative">
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
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-gray-300" />
                )}
              </div>
            </div>
            <button className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mb-20">
            <h1 className="text-3xl font-black text-white drop-shadow-md">
              {profile.first_name} {profile.last_name}
            </h1>
            <div className="flex items-center text-blue-100 font-medium mt-1">
              <Library className="h-4 w-4 mr-1.5" />
              Head Librarian
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
                Staff Role
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Role</span>
                <span className="text-sm font-black text-blue-600">Librarian</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Access Level</span>
                <span className="text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                  Full Catalog
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-0 shadow-md bg-white dark:bg-gray-800 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-gray-700/50 pb-4">
              <CardTitle className="text-xl font-bold flex items-center text-gray-900 dark:text-white">
                <User className="mr-2 h-5 w-5 text-indigo-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input value={profile.first_name} readOnly className="pl-10 bg-gray-50 dark:bg-gray-900 border-0 font-semibold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input value={profile.last_name} readOnly className="pl-10 bg-gray-50 dark:bg-gray-900 border-0 font-semibold" />
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
                    <Input value={profile.phone || 'N/A'} readOnly className="pl-10 bg-gray-50 dark:bg-gray-900 border-0 font-semibold" />
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
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl font-semibold text-gray-700 dark:text-gray-300">
                  {profile.current_address || 'Not updated'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Permanent Address</Label>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl font-semibold text-gray-700 dark:text-gray-300">
                  {profile.permanent_address || 'Not updated'}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={openEditModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl shadow-xl font-bold transition-all hover:-translate-y-1"
            >
              Update Profile Information
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex flex-row justify-between items-center">
              <CardTitle className="text-xl">Edit Contact Info</CardTitle>
              <button 
                onClick={() => setIsEditing(false)} 
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. 0300-1234567" 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Address</Label>
                  <Input 
                    value={formData.current_address} 
                    onChange={(e) => setFormData({...formData, current_address: e.target.value})}
                    placeholder="Where are you currently living?" 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permanent Address</Label>
                  <Input 
                    value={formData.permanent_address} 
                    onChange={(e) => setFormData({...formData, permanent_address: e.target.value})}
                    placeholder="Your permanent home address" 
                    className="rounded-xl"
                  />
                </div>
                <div className="pt-6 flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
