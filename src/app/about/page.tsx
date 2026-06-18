'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronRight, 
  Target, 
  Lightbulb, 
  Compass, 
  Award,
  Globe,
  BookOpen
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] left-[20%] w-[50%] h-[50%] bg-blue-300/30 dark:bg-blue-900/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-[40%] right-[0%] w-[40%] h-[40%] bg-indigo-300/20 dark:bg-indigo-900/10 rounded-full blur-[120px] animate-float-slow" />
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
          <Link href="/admissions" className="hover:text-blue-600 transition-colors hidden sm:block">Admissions</Link>
          <Link 
            href="/login" 
            className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg hover:-translate-y-0.5"
          >
            Portal Login
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Header Section */}
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-bold mb-6">
            About Us
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">
            Shaping the Future <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Through Innovation
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            HITEC University stands as a beacon of academic excellence and technological advancement. 
            Our motto <strong className="text-blue-600 dark:text-blue-400">"In Truth I Triumph"</strong> reflects our 
            unwavering commitment to integrity, research, and producing the next generation of global leaders.
          </p>
        </section>

        {/* Mission & Vision Grid */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 hover:shadow-2xl transition-all duration-300 group">
              <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Our Mission</h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                To provide accessible, high-quality education that bridges the gap between theoretical knowledge and practical industry applications, empowering students to solve real-world problems.
              </p>
            </div>
            <div className="p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-900/5 hover:shadow-2xl transition-all duration-300 group">
              <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lightbulb className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Our Vision</h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                To emerge as a world-class institution globally recognized for academic distinction, pioneering research, and producing ethically grounded professionals.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">Core Values</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Compass, title: 'Integrity', desc: 'Upholding the highest ethical standards in all endeavors.' },
              { icon: Award, title: 'Excellence', desc: 'Pursuing exceptional quality in teaching, research, and service.' },
              { icon: Globe, title: 'Diversity', desc: 'Fostering an inclusive and globally connected campus community.' },
              { icon: BookOpen, title: 'Innovation', desc: 'Embracing creativity and cutting-edge technological advancement.' }
            ].map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center p-6">
                  <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                    <Icon className="h-10 w-10" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{val.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Call to action */}
        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="p-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-4xl font-bold text-white mb-6 relative z-10">Join Our Community</h2>
            <p className="text-blue-100 text-lg mb-10 relative z-10 max-w-2xl mx-auto">
              Experience a transformative educational journey at HITEC University. 
              Access your personalized smart portal to get started.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center px-8 py-4 bg-white text-blue-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-lg relative z-10"
            >
              Access HiSUP Portal
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 text-center border-t border-slate-200/50 dark:border-slate-800/50">
        <p className="text-slate-500 dark:text-slate-400 font-medium">© {new Date().getFullYear()} HITEC University. All rights reserved.</p>
      </footer>
    </div>
  );
}
