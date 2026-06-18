'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { GraduationCap, ShieldCheck, Library, ArrowLeft, Briefcase, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const ROLES = [
  {
    id: 'student',
    name: 'Student Portal',
    desc: 'Access academics, fees, and library',
    icon: GraduationCap,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/50',
    borderColor: 'border-blue-200 dark:border-blue-800 hover:border-blue-500',
    theme: 'border-t-blue-600 dark:border-t-blue-500'
  },
  {
    id: 'faculty',
    name: 'Faculty Portal',
    desc: 'Manage courses, grading, and attendance',
    icon: Briefcase,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    borderColor: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-500',
    theme: 'border-t-emerald-600 dark:border-t-emerald-500'
  },
  {
    id: 'librarian',
    name: 'Librarian Portal',
    desc: 'Manage catalog, circulation, and fines',
    icon: Library,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/50',
    borderColor: 'border-orange-200 dark:border-orange-800 hover:border-orange-500',
    theme: 'border-t-orange-600 dark:border-t-orange-500'
  },
  {
    id: 'admin',
    name: 'Admin Portal',
    desc: 'System administration and records',
    icon: ShieldCheck,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/50',
    borderColor: 'border-purple-200 dark:border-purple-800 hover:border-purple-500',
    theme: 'border-t-purple-600 dark:border-t-purple-500'
  }
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams.get('role');

  const [selectedRole, setSelectedRole] = useState<typeof ROLES[0] | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleId) {
      const role = ROLES.find(r => r.id === roleId);
      if (role) {
        setSelectedRole(role);
      }
    }
  }, [roleId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role_id')
            .eq('id', data.user.id)
            .single();

        if (userError || !userData) {
            throw new Error("User record not found. Please contact admin.");
        }

        const rolesMap: Record<number, string> = { 1: 'admin', 2: 'faculty', 3: 'student', 4: 'librarian', 5: 'finance' };
        const rolePath = rolesMap[userData.role_id] || 'student';
        
        router.push(`/${rolePath}`);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // View 1: Role Selection (Fallback if no role in URL)
  if (!selectedRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center text-balance">
          <Link href="/" className="inline-flex justify-center mb-8 group">
            <div className="h-20 w-20 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl transform transition-all group-hover:scale-110 group-hover:rotate-3">
              <span className="text-white font-bold text-4xl">H</span>
            </div>
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
            Choose Your Portal
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Select your designation to access the HiSUP ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`group flex items-start p-6 bg-white dark:bg-gray-900 rounded-3xl border-2 transition-all duration-300 text-left shadow-sm hover:shadow-2xl hover:-translate-y-1 ${role.borderColor} dark:border-gray-800`}
              >
                <div className={`p-4 rounded-2xl mr-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${role.bg}`}>
                  <Icon className={`h-8 w-8 ${role.color}`} />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {role.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium text-pretty">
                    {role.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        
        <Link href="/" className="mt-12 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>
    );
  }

  // View 2: Login Form
  const SelectedIcon = selectedRole.icon;
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <Card className={`w-full max-w-md shadow-2xl border-t-4 dark:bg-gray-900 dark:border-gray-800 overflow-hidden transition-all duration-500 ${selectedRole.theme}`}>
        <CardHeader className="space-y-1 relative pt-12 pb-8 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800">
          <button 
            onClick={() => setSelectedRole(null)}
            className="absolute left-6 top-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center text-xs font-bold uppercase tracking-wider bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Switch Role
          </button>
          
          <div className="flex flex-col items-center justify-center text-center">
            <div className={`flex h-20 w-20 items-center justify-center rounded-2xl mb-6 shadow-inner transition-transform duration-500 hover:scale-110 ${selectedRole.bg}`}>
              <SelectedIcon className={`h-10 w-10 ${selectedRole.color}`} />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
              {selectedRole.name}
            </CardTitle>
            <CardDescription className="text-base text-gray-500 dark:text-gray-400 px-6 font-medium">
              Enter your credentials to access your dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 md:p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm font-bold text-red-800 dark:text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-wider">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@hitecuni.edu.pk" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-14 pl-12 pr-4 rounded-2xl text-base border-2 border-gray-100 dark:border-gray-800 dark:bg-gray-950 focus:border-blue-500 focus:ring-0 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Password</Label>
                <Link href="/forgot-password" title="Coming soon" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors uppercase tracking-widest">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-14 pl-12 pr-4 rounded-2xl text-base border-2 border-gray-100 dark:border-gray-800 dark:bg-gray-950 focus:border-blue-500 focus:ring-0 transition-all"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className={`w-full mt-4 h-14 text-lg font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl border-0`}
              disabled={loading}
              style={{
                background: selectedRole.id === 'student' ? 'linear-gradient(to right, #2563eb, #1d4ed8)' : 
                            selectedRole.id === 'faculty' ? 'linear-gradient(to right, #059669, #047857)' : 
                            selectedRole.id === 'admin' ? 'linear-gradient(to right, #9333ea, #7e22ce)' : 
                            'linear-gradient(to right, #ea580c, #c2410c)'
              }}
            >
              {loading ? (
                <span className="flex items-center space-x-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Verifying...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Sign In to {selectedRole.name.split(' ')[0]}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </span>
              )}
            </Button>

            {selectedRole.id === 'student' && (
              <div className="mt-8 text-center text-sm pt-6 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Don't have an account? </span>
                <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors">
                  Sign up here
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      
      {/* Decorative background for login form */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <div className={`absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl ${selectedRole.bg}`} />
        <div className={`absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl ${selectedRole.bg}`} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
