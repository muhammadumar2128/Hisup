'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GraduationCap, 
  ShieldCheck, 
  Library, 
  Briefcase, 
  ArrowRight,
  Sparkles,
  BookOpen,
  Users,
  Building2,
  ChevronRight
} from 'lucide-react';

const PORTALS = [
  {
    id: 'student',
    name: 'Student Portal',
    desc: 'Access your courses, grades, attendance, and library resources.',
    icon: GraduationCap,
    color: 'from-blue-500 to-blue-700',
    lightColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
    hoverBorder: 'hover:border-blue-400'
  },
  {
    id: 'faculty',
    name: 'Faculty Portal',
    desc: 'Manage your classes, student performance, and academic records.',
    icon: Briefcase,
    color: 'from-indigo-500 to-indigo-700',
    lightColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-100',
    hoverBorder: 'hover:border-indigo-400'
  },
  {
    id: 'librarian',
    name: 'Librarian Portal',
    desc: 'Maintain the digital catalog, manage books and circulation.',
    icon: Library,
    color: 'from-cyan-500 to-cyan-700',
    lightColor: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-100',
    hoverBorder: 'hover:border-cyan-400'
  },
  {
    id: 'admin',
    name: 'Admin Portal',
    desc: 'System-wide configuration, user management, and reporting.',
    icon: ShieldCheck,
    color: 'from-sky-500 to-sky-700',
    lightColor: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-100',
    hoverBorder: 'hover:border-sky-400'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-300/30 dark:bg-blue-900/20 rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute top-[20%] right-[0%] w-[40%] h-[40%] bg-indigo-300/30 dark:bg-indigo-900/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[0%] left-[20%] w-[30%] h-[30%] bg-cyan-300/20 dark:bg-cyan-900/20 rounded-full blur-[100px] animate-float-slow" />
      </div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-4">
          <div className="relative h-14 w-14 rounded-full overflow-hidden bg-white shadow-lg p-1">
            <Image 
              src="/logo.png" 
              alt="HITEC University Logo" 
              fill
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
              HITEC University
            </span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide">
              Smart Portal
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-600 dark:text-slate-300">
          <Link href="/about" className="hover:text-blue-600 transition-colors">About HITEC</Link>
          <Link href="/admissions" className="hover:text-blue-600 transition-colors">Admissions</Link>
          <Link 
            href="/login" 
            className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transform hover:-translate-y-0.5"
          >
            Portal Login
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-24 mt-10 space-y-6 flex flex-col items-center">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-sm font-bold mb-6 border border-blue-100 dark:border-blue-900/50 shadow-xl shadow-blue-900/5 animate-float-slow">
            <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
            Empowering Education through Technology
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl">
            In Truth <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 animate-gradient-x">
              I Triumph
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium mt-6">
            Welcome to the unified digital ecosystem of HITEC University. 
            Seamlessly manage your academic journey, resources, and administration in one intelligent platform.
          </p>
          
          <div className="pt-8 flex flex-wrap justify-center gap-4">
            <Link 
              href="/about" 
              className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-full font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center"
            >
              Discover HiSUP
            </Link>
          </div>
        </div>

        {/* Courses Offered Marquee Banner */}
        <div className="mb-24 w-full overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 py-4 shadow-inner relative rounded-3xl border border-white/10">
          <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-blue-600 to-transparent z-10 rounded-l-3xl pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-indigo-700 to-transparent z-10 rounded-r-3xl pointer-events-none"></div>
          
          <div className="flex w-max animate-scroll-left hover:pause">
            {/* The list is duplicated twice to create the infinite scroll effect */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex shrink-0 items-center justify-around gap-12 px-6">
                {['BS Computer Science', 'BS Software Engineering', 'BS Artificial Intelligence', 'BS Electrical Engineering', 'BS Mechanical Engineering', 'BBA (Honors)', 'MS Computer Science'].map((course, idx) => (
                  <div key={idx} className="flex items-center text-white/90 whitespace-nowrap">
                    <Sparkles className="h-4 w-4 mr-3 text-blue-200 shrink-0" />
                    <span className="font-bold text-lg tracking-wide">{course}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Portal Grid with Deep Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PORTALS.map((portal, index) => {
            const Icon = portal.icon;
            return (
              <Link 
                key={portal.id}
                href={`/login?role=${portal.id}`}
                className={`group relative p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white dark:border-slate-800 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`h-16 w-16 mb-8 rounded-2xl flex items-center justify-center bg-gradient-to-br ${portal.color} shadow-lg shadow-blue-500/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {portal.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium text-sm">
                  {portal.desc}
                </p>

                <div className="flex items-center font-bold text-sm tracking-wide uppercase mt-auto">
                  <span className={`${portal.lightColor} group-hover:mr-2 transition-all duration-300`}>
                    Access Portal
                  </span>
                  <ArrowRight className={`h-4 w-4 ${portal.lightColor} opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0`} />
                </div>

                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.05] transition-opacity pointer-events-none bg-gradient-to-br ${portal.color}`} />
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-y border-slate-200/50 dark:border-slate-800/50">
          <div className="text-center">
            <h4 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">5,000+</h4>
            <p className="text-blue-600 dark:text-blue-400 font-bold tracking-wide uppercase text-sm">Enrolled Students</p>
          </div>
          <div className="text-center">
            <h4 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">300+</h4>
            <p className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm">Expert Faculty</p>
          </div>
          <div className="text-center">
            <h4 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">50+</h4>
            <p className="text-cyan-600 dark:text-cyan-400 font-bold tracking-wide uppercase text-sm">Academic Programs</p>
          </div>
          <div className="text-center">
            <h4 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">100k+</h4>
            <p className="text-sky-600 dark:text-sky-400 font-bold tracking-wide uppercase text-sm">Library Resources</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-10">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="font-bold text-xl text-slate-900 dark:text-white">Smart Library</h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Search, reserve, and manage books digitally with real-time updates and fine management.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <h4 className="font-bold text-xl text-slate-900 dark:text-white">Connected Campus</h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Empowering instructors and students with tools for automated attendance and streamlined communication.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl">
              <Building2 className="h-8 w-8 text-cyan-600" />
            </div>
            <h4 className="font-bold text-xl text-slate-900 dark:text-white">Central Administration</h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Centralized control for institutional data, finance, user roles, and system-wide configurations.
            </p>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 text-center border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
        <p className="text-slate-500 dark:text-slate-400 font-medium">© {new Date().getFullYear()} HITEC Smart University Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}
