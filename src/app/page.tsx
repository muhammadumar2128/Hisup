'use client';

import React, { useEffect, useState } from 'react';
import Chatbot from '@/components/shared/Chatbot';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
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
  Sun,
  Moon,
  Calendar,
  Bell
} from 'lucide-react';

const PORTALS = [
  {
    id: 'student',
    name: 'Student Portal',
    desc: 'Access your courses, grades, attendance, and library resources.',
    icon: GraduationCap,
    color: 'from-blue-500 to-blue-700',
    lightColor: 'text-blue-600',
  },
  {
    id: 'faculty',
    name: 'Faculty Portal',
    desc: 'Manage your classes, student performance, and academic records.',
    icon: Briefcase,
    color: 'from-indigo-500 to-indigo-700',
    lightColor: 'text-indigo-600',
  },
  {
    id: 'librarian',
    name: 'Librarian Portal',
    desc: 'Maintain the digital catalog, manage books and circulation.',
    icon: Library,
    color: 'from-cyan-500 to-cyan-700',
    lightColor: 'text-cyan-600',
  },
  {
    id: 'admin',
    name: 'Admin Portal',
    desc: 'System-wide configuration, user management, and reporting.',
    icon: ShieldCheck,
    color: 'from-sky-500 to-sky-700',
    lightColor: 'text-sky-600',
  }
];

const NEWS = [
  {
    title: 'Spring 2026 Admissions Open',
    date: 'Oct 15, 2025',
    type: 'Admissions',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  },
  {
    title: 'Annual Tech Symposium Announced',
    date: 'Nov 02, 2025',
    type: 'Event',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
  },
  {
    title: 'Library Extended Hours for Finals',
    date: 'Dec 10, 2025',
    type: 'Update',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
  }
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 1200);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <>
      <AnimatePresence>
        {showPreloader && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/35">
                <span className="text-white font-black text-4xl">H</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black tracking-tight leading-none text-white">
                  HITEC
                </span>
                <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase mt-1.5">
                  Smart Portal
                </span>
              </div>
              <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="absolute top-0 bottom-0 w-1/2 bg-blue-500 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden relative transition-colors duration-300">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-300/30 dark:bg-blue-900/20 rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute top-[20%] right-[0%] w-[40%] h-[40%] bg-indigo-300/30 dark:bg-indigo-900/20 rounded-full blur-[120px] animate-float" />
      </div>

      {/* Sticky Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-4">
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-white shadow-lg p-1">
              <Image src="/logo.png" alt="HITEC University Logo" fill className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                HITEC
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                Smart Portal
              </span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-6 md:space-x-8 text-sm font-bold text-slate-600 dark:text-slate-300">
            <Link href="/about" className="hidden md:block hover:text-blue-600 transition-colors">About</Link>
            <Link href="/admissions" className="hidden md:block hover:text-blue-600 transition-colors">Admissions</Link>
            
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
              </button>
            )}

            <Link 
              href="/login" 
              className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transform hover:-translate-y-0.5"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 md:pt-40 pb-24 relative z-10">
        {/* Split Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-bold border border-blue-100 dark:border-blue-900/50">
              <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
              Empowering Education through Technology
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              In Truth <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500">
                I Triumph
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-lg">
              Welcome to the unified digital ecosystem of HITEC University. 
              Seamlessly manage your academic journey, resources, and administration in one intelligent platform.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/login" className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center group">
                Access Portals
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/about" className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-full font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-md">
                Discover HiSUP
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[400px] md:h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 hidden lg:block"
          >
            <Image 
              src="/hero.png" 
              alt="HITEC University Tech" 
              fill 
              className="object-cover"
              priority
            />
          </motion.div>
        </div>

        {/* Portal Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-32"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Choose Your Portal</h2>
            <p className="text-slate-500 mt-4 font-medium">Log in to the portal tailored to your role</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              return (
                <motion.div key={portal.id} variants={itemVariants}>
                  <Link 
                    href={`/login?role=${portal.id}`}
                    className="group flex flex-col h-full p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden"
                  >
                    <div className={`h-16 w-16 mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br ${portal.color} shadow-lg shadow-blue-500/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {portal.name}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium text-sm flex-grow">
                      {portal.desc}
                    </p>

                    <div className="flex items-center font-bold text-sm tracking-wide uppercase mt-auto">
                      <span className={`${portal.lightColor} group-hover:mr-2 transition-all duration-300`}>
                        Access Portal
                      </span>
                      <ArrowRight className={`h-4 w-4 ${portal.lightColor} opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0`} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* News & Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 grid grid-cols-2 gap-6 bg-blue-600 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="space-y-2 z-10">
              <h4 className="text-4xl md:text-5xl font-black">5,000+</h4>
              <p className="text-blue-100 font-bold uppercase text-sm tracking-wider">Students</p>
            </div>
            <div className="space-y-2 z-10">
              <h4 className="text-4xl md:text-5xl font-black">300+</h4>
              <p className="text-blue-100 font-bold uppercase text-sm tracking-wider">Faculty</p>
            </div>
            <div className="space-y-2 z-10 mt-8">
              <h4 className="text-4xl md:text-5xl font-black">50+</h4>
              <p className="text-blue-100 font-bold uppercase text-sm tracking-wider">Programs</p>
            </div>
            <div className="space-y-2 z-10 mt-8">
              <h4 className="text-4xl md:text-5xl font-black">100k+</h4>
              <p className="text-blue-100 font-bold uppercase text-sm tracking-wider">Books</p>
            </div>
          </motion.div>

          {/* News Updates */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Latest Updates</h3>
            </div>
            
            <div className="space-y-6">
              {NEWS.map((item, idx) => (
                <div key={idx} className="group border-b border-slate-100 dark:border-slate-800 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${item.color}`}>
                      {item.type}
                    </span>
                    <span className="text-sm text-slate-500 font-medium flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {item.date}
                    </span>
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-bold leading-tight group-hover:text-blue-600 transition-colors cursor-pointer">
                    {item.title}
                  </h4>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 text-center border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
          © {new Date().getFullYear()} HITEC Smart University Portal. All rights reserved.
        </p>
      </footer>

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
    </>
  );
}
