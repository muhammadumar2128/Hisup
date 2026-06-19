'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import GradientStatCard from '@/components/ui/GradientStatCard';
import ProgressRing from '@/components/ui/ProgressRing';
import { BookOpen, BookUp, AlertCircle, Clock, Library, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LibrarianDashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeLoans: 0,
    overdueReturns: 0,
    unpaidFines: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Total Books (Titles)
        const { count: booksCount } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true });

        // 2. Active & Overdue Loans
        const { data: activeTxns } = await supabase
          .from('library_transactions')
          .select('due_date')
          .eq('status', 'Issued');

        let activeLoans = 0;
        let overdueReturns = 0;
        
        if (activeTxns) {
          activeLoans = activeTxns.length;
          const today = new Date().toISOString().split('T')[0];
          overdueReturns = activeTxns.filter(t => t.due_date < today).length;
        }

        // 3. Unpaid Fines
        const { data: fines } = await supabase
          .from('library_fines')
          .select('fine_amount')
          .eq('status', 'Unpaid');

        let unpaidFines = 0;
        if (fines) {
          unpaidFines = fines.reduce((sum, fine) => sum + Number(fine.fine_amount), 0);
        }

        setStats({
          totalBooks: booksCount || 0,
          activeLoans,
          overdueReturns,
          unpaidFines
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-60"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-40"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Library Dashboard 📚
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage library resources, circulation, and user fines
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/librarian/catalog"
            className="inline-flex items-center px-5 py-2.5 bg-cyan-600 text-white font-bold text-sm rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/40 hover:-translate-y-0.5"
          >
            Browse Catalog
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard
          title="Total Books"
          value={stats.totalBooks}
          subtitle="Unique titles in catalog"
          icon={BookOpen}
          gradient="blue"
        />
        <GradientStatCard
          title="Active Loans"
          value={stats.activeLoans}
          subtitle="Currently checked out"
          icon={BookUp}
          gradient="emerald"
        />
        <GradientStatCard
          title="Overdue Returns"
          value={stats.overdueReturns}
          subtitle={stats.overdueReturns > 0 ? 'Require attention' : 'All on time!'}
          icon={Clock}
          gradient={stats.overdueReturns > 0 ? 'orange' : 'emerald'}
        />
        <GradientStatCard
          title="Unpaid Fines"
          value={`Rs. ${stats.unpaidFines.toLocaleString()}`}
          subtitle="Outstanding"
          icon={AlertCircle}
          gradient={stats.unpaidFines > 0 ? 'red' : 'emerald'}
        />
      </div>

      {/* Circulation Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Circulation Ring */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
            <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
              <Library className="mr-2 h-5 w-5 text-cyan-600" />
              Circulation Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center space-y-4">
              <ProgressRing
                value={stats.activeLoans}
                max={stats.totalBooks || 1}
                size={160}
                strokeWidth={14}
                gradientFrom="#06b6d4"
                gradientTo="#3b82f6"
                trackColor="#e2e8f0"
                displayValue={String(stats.activeLoans)}
                label="Active"
                sublabel={`of ${stats.totalBooks} total books`}
              />
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                stats.overdueReturns === 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {stats.overdueReturns === 0 ? '✅ All returns on time' : `⚠️ ${stats.overdueReturns} overdue`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
            <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
              <BookUp className="mr-2 h-5 w-5 text-emerald-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Catalog', href: '/librarian/catalog', icon: BookOpen, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
                { label: 'Circulation', href: '/librarian/circulation', icon: BookUp, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
                { label: 'Members', href: '/librarian/members', icon: Library, color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
                { label: 'Fines', href: '/librarian/fines', icon: AlertCircle, color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20' },
              ].map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="group flex flex-col items-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} shadow-lg ${action.shadow} mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <ActionIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
