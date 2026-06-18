'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { GraduationCap, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchPrograms() {
      const { data, error } = await supabase.from('programs').select('id, name, code');
      if (data) setPrograms(data);
    }
    fetchPrograms();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedProgram) {
      setError('Please select a program.');
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up user via Supabase Auth
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'Student', // Tells the trigger to create student_profiles
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            cnic: cnic,
            gender: gender,
            dob: dob,
            current_address: currentAddress,
            permanent_address: permanentAddress,
            program_id: selectedProgram,
          },
        },
      });

      if (signupError) throw signupError;

      if (data.user) {
        setSuccess(true);
        // After a few seconds, redirect to login
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md text-center py-8">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <UserPlus className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <p className="text-gray-500">
              Please check your email to verify your account. Redirecting to login...
            </p>
            <Button variant="outline" onClick={() => router.push('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-blue-600 dark:bg-gray-800 dark:border-gray-700 dark:border-t-blue-500">
        <CardHeader className="space-y-1 items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 mb-4">
            <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-300" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Student Registration
          </CardTitle>
          <CardDescription>
            Create your HiSUP account to start your academic journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  placeholder="John" 
                  required 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Doe" 
                  required 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="student@hitecuni.edu.pk" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="0300-1234567" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnic">CNIC</Label>
                <Input 
                  id="cnic" 
                  placeholder="12345-1234567-1" 
                  required 
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-50 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900"
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={loading}
                >
                  <option value="Male" className="text-gray-900">Male</option>
                  <option value="Female" className="text-gray-900">Female</option>
                  <option value="Other" className="text-gray-900">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input 
                  id="dob" 
                  type="date"
                  required 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Academic Program</Label>
              <select
                id="program"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-50 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900"
                required
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                disabled={loading}
              >
                <option value="" disabled className="text-gray-900">Select your program...</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id} className="text-gray-900">
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAddress">Current Address</Label>
              <Input 
                id="currentAddress" 
                placeholder="123 Main St, City" 
                required 
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="permanentAddress">Permanent Address</Label>
              <Input 
                id="permanentAddress" 
                placeholder="123 Main St, City" 
                required 
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign up'}
            </Button>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-500">Already have an account? </span>
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
