'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, Role } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          // 1. Fetch user role and basic profile
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role_id, email')
            .eq('id', session.user.id)
            .single();

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, phone')
            .eq('id', session.user.id)
            .single();

          if (userError || profileError) {
             console.error("AuthContext Fetch Error details:", JSON.stringify(userError || profileError, null, 2));
             setUser(null);
             setLoading(false);
             return;
          }

          if (userData && profileData) {
             const roles: Record<number, Role> = { 1: 'Admin', 2: 'Faculty', 3: 'Student', 4: 'Librarian', 5: 'Finance' };
             const role = roles[userData.role_id] || 'Student';
             
             let designation = '';
             if (role === 'Faculty') {
               const { data: facultyData } = await supabase
                 .from('faculty_profiles')
                 .select('designation')
                 .eq('id', session.user.id)
                 .single();
               if (facultyData) designation = facultyData.designation;
             }

             setUser({
               id: session.user.id,
               email: userData.email,
               role: role,
               firstName: profileData.first_name,
               lastName: profileData.last_name,
               avatarUrl: profileData.avatar_url,
               phone: profileData.phone,
               designation: designation
             });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication Error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Role-based route guarding
  useEffect(() => {
    if (!loading) {
      const publicRoutes = ['/login', '/signup', '/', '/forgot-password', '/about', '/admissions'];
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!user && !isPublicRoute) {
        console.log("No user found, redirecting to login");
        router.push('/login');
      } else if (user) {
        const rolePath = `/${user.role.toLowerCase()}`;
        
        if (isPublicRoute) {
          console.log("User logged in, redirecting to dashboard:", rolePath);
          router.push(rolePath);
        } else {
          // ADMIN BYPASS: Allow Admin to access any role path
          const isRolePath = pathname.startsWith('/admin') || 
                             pathname.startsWith('/faculty') || 
                             pathname.startsWith('/student') || 
                             pathname.startsWith('/finance') || 
                             pathname.startsWith('/librarian');

          if (user.role === 'Admin') {
            // Admin can go anywhere role-based
            if (!isRolePath && !pathname.startsWith('/api') && !pathname.startsWith('/shared')) {
               router.push(rolePath);
            }
          } else {
            // Other roles are restricted to their own path
            if (!pathname.startsWith(rolePath) && !pathname.startsWith('/api') && !pathname.startsWith('/shared')) {
               console.log("User attempting unauthorized role path, redirecting to:", rolePath);
               router.push(rolePath);
            }
          }
        }
      }
    }
  }, [user, loading, pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
