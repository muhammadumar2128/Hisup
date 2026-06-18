'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronRight, 
  GraduationCap,
  Award,
  TrendingUp,
  CheckCircle2,
  CalendarDays,
  Rocket
} from 'lucide-react';

export default function AdmissionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] left-[10%] w-[50%] h-[50%] bg-blue-400/20 dark:bg-blue-900/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-[30%] right-[0%] w-[40%] h-[40%] bg-purple-400/20 dark:bg-purple-900/10 rounded-full blur-[120px] animate-float-slow" />
      </div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10 border-b border-slate-200/50 dark:border-slate-800/50">
        <Link href="/" className="flex items-center space-x-4 hover:opacity-90 transition-opacity">
          <div className="relative h-14 w-14 rounded-full overflow-hidden bg-white shadow-md p-1">
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
          </div>
        </Link>
        <div className="flex items-center space-x-6 text-sm font-bold text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-blue-600 transition-colors hidden sm:block">Home</Link>
          <Link href="/about" className="hover:text-blue-600 transition-colors hidden sm:block">About</Link>
          <Link 
            href="/login" 
            className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg hover:-translate-y-0.5"
          >
            Apply Now
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Admissions 2026 Banner Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 p-10 md:p-16 shadow-2xl">
            {/* Inner decorative blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 animate-float" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-bold mb-6 backdrop-blur-md border border-white/20">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Fall 2026 Session
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
                  Admissions <br /> Are Now Open
                </h1>
                <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-lg font-medium">
                  Take the first step towards a brilliant future. Join HITEC University and become part of a legacy of excellence, innovation, and triumph.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/login" 
                    className="inline-flex justify-center items-center px-8 py-4 bg-white text-blue-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-lg"
                  >
                    Start Your Application
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link 
                    href="#programs" 
                    className="inline-flex justify-center items-center px-8 py-4 bg-transparent text-white font-bold rounded-full border border-white/30 hover:bg-white/10 transition-colors"
                  >
                    View Programs
                  </Link>
                </div>
              </div>
              
              {/* Feature Cards in Hero */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white transform hover:-translate-y-2 transition-transform duration-300 mt-8">
                  <Award className="h-8 w-8 mb-4 text-blue-200" />
                  <h3 className="font-bold text-xl mb-1">Top Tier</h3>
                  <p className="text-blue-100 text-sm">Ranked among the best universities globally.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white transform hover:-translate-y-2 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 mb-4 text-blue-200" />
                  <h3 className="font-bold text-xl mb-1">98% Placement</h3>
                  <p className="text-blue-100 text-sm">Employment rate within 6 months of graduation.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white transform hover:-translate-y-2 transition-transform duration-300 col-span-2">
                  <Rocket className="h-8 w-8 mb-4 text-blue-200" />
                  <h3 className="font-bold text-xl mb-1">State of the Art Facilities</h3>
                  <p className="text-blue-100 text-sm">Experience the best labs, libraries, and campus life.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why HITEC? Past Greatness Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">A Legacy of Greatness</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">
              Over the years, HITEC has produced industry leaders, groundbreaking research, and technological marvels.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all">
              <h3 className="text-5xl font-black text-blue-600 dark:text-blue-400 mb-4">15k+</h3>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Global Alumni Network</h4>
              <p className="text-slate-500 dark:text-slate-400">Our graduates are leading teams in over 40 countries worldwide.</p>
            </div>
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all">
              <h3 className="text-5xl font-black text-indigo-600 dark:text-indigo-400 mb-4">500+</h3>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Research Publications</h4>
              <p className="text-slate-500 dark:text-slate-400">Recognized globally for contributions to science and technology.</p>
            </div>
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all">
              <h3 className="text-5xl font-black text-purple-600 dark:text-purple-400 mb-4">100%</h3>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Accredited Programs</h4>
              <p className="text-slate-500 dark:text-slate-400">Every engineering and computing program is fully accredited.</p>
            </div>
          </div>
        </section>

        {/* Featured Alumni Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 bg-slate-100 dark:bg-slate-900/50 rounded-[3rem] my-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Our Featured Alumni</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">
              See where a degree from HITEC University can take you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Khan',
                role: 'Senior Software Engineer @ Google',
                quote: 'HITEC gave me the foundation and the problem-solving skills I needed to succeed at a top tech company. The faculty support was incredible.',
                year: 'Class of 2018'
              },
              {
                name: 'Ali Raza',
                role: 'Aerospace Systems Manager @ SpaceX',
                quote: 'The hands-on lab experience and rigorous engineering curriculum at HITEC prepared me for the most challenging projects in the aerospace industry.',
                year: 'Class of 2016'
              },
              {
                name: 'Aisha Mahmood',
                role: 'Chief Technical Officer @ TechInnovate',
                quote: 'From leading student projects to launching my own startup, the entrepreneurial ecosystem at HITEC shaped my career journey.',
                year: 'Class of 2020'
              }
            ].map((alumni, idx) => (
              <div key={idx} className="p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 relative">
                <div className="absolute top-8 right-8 text-blue-100 dark:text-slate-700">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic mb-8 relative z-10 leading-relaxed">
                  "{alumni.quote}"
                </p>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {alumni.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{alumni.name}</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{alumni.role}</p>
                    <p className="text-xs text-slate-500 mt-1">{alumni.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Programs Offered */}
        <section id="programs" className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Academic Faculties</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">
              Explore our diverse range of undergraduate and graduate programs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Computer Science & IT', 'Electrical Engineering', 'Mechanical Engineering', 'Business Administration'].map((prog, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group cursor-pointer">
                <GraduationCap className="h-8 w-8 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{prog}</h4>
                <div className="flex items-center text-sm font-bold text-blue-600 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 text-center border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
        <p className="text-slate-500 dark:text-slate-400 font-medium">© {new Date().getFullYear()} HITEC University Admissions. All rights reserved.</p>
      </footer>
    </div>
  );
}
