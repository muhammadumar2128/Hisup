'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import GradientStatCard from '@/components/ui/GradientStatCard';
import ProgressRing from '@/components/ui/ProgressRing';
import { Banknote, CreditCard, Clock, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FinanceStats {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  paidCount: number;
  unpaidCount: number;
}

const COLORS = ['#10b981', '#f59e0b'];

export default function FinanceDashboard() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinanceStats() {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('total_amount, status');

        if (error) throw error;

        let totalInvoiced = 0;
        let totalPaid = 0;
        let totalPending = 0;
        let paidCount = 0;
        let unpaidCount = 0;

        (data || []).forEach(inv => {
          const amt = Number(inv.total_amount);
          totalInvoiced += amt;
          if (inv.status === 'Paid') {
            totalPaid += amt;
            paidCount++;
          } else {
            totalPending += amt;
            unpaidCount++;
          }
        });

        setStats({
          totalInvoiced,
          totalPaid,
          totalPending,
          paidCount,
          unpaidCount
        });

      } catch (err) {
        console.error("Error fetching finance stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFinanceStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-60"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-40"></div>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const recoveryRate = stats.totalInvoiced > 0 ? ((stats.totalPaid / stats.totalInvoiced) * 100) : 0;

  const chartData = [
    { name: 'Collected', value: stats.totalPaid },
    { name: 'Pending', value: stats.totalPending },
  ];

  const statusData = [
    { name: 'Paid', value: stats.paidCount },
    { name: 'Unpaid', value: stats.unpaidCount },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Finance Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Real-time revenue tracking and invoice status</p>
      </div>

      {/* Gradient Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard
          title="Total Invoiced"
          value={`Rs. ${stats.totalInvoiced.toLocaleString()}`}
          subtitle="Gross accounts receivable"
          icon={Banknote}
          gradient="blue"
        />
        <GradientStatCard
          title="Collected Revenue"
          value={`Rs. ${stats.totalPaid.toLocaleString()}`}
          subtitle={`${recoveryRate.toFixed(1)}% recovery rate`}
          icon={CheckCircle2}
          gradient="emerald"
        />
        <GradientStatCard
          title="Pending Amount"
          value={`Rs. ${stats.totalPending.toLocaleString()}`}
          subtitle="Outstanding dues"
          icon={Clock}
          gradient="orange"
        />
        <GradientStatCard
          title="Unpaid Invoices"
          value={stats.unpaidCount}
          subtitle={stats.unpaidCount > 0 ? 'Require follow-up' : 'All clear!'}
          icon={AlertCircle}
          gradient={stats.unpaidCount > 0 ? 'red' : 'emerald'}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Distribution */}
        <Card className="lg:col-span-4 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
            <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
              Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-6">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" tick={{ fontSize: 13, fontWeight: 600 }} />
                   <Tooltip 
                     formatter={(value: any) => `Rs. ${Number(value || 0).toLocaleString()}`}
                     contentStyle={{ 
                       borderRadius: '16px', 
                       border: 'none', 
                       boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                       fontSize: '14px',
                       fontWeight: 600,
                     }}
                   />
                   <Bar dataKey="value" fill="url(#financeBarGradient)" radius={[0, 8, 8, 0]} barSize={40} />
                   <defs>
                     <linearGradient id="financeBarGradient" x1="0" y1="0" x2="1" y2="0">
                       <stop offset="0%" stopColor="#3b82f6" />
                       <stop offset="100%" stopColor="#8b5cf6" />
                     </linearGradient>
                   </defs>
                </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recovery Ring + Invoice Status */}
        <Card className="lg:col-span-3 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
            <CardTitle className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
              <CreditCard className="mr-2 h-5 w-5 text-emerald-600" />
              Recovery Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center space-y-6">
              <ProgressRing
                value={recoveryRate}
                max={100}
                size={160}
                strokeWidth={14}
                gradientFrom="#10b981"
                gradientTo="#06b6d4"
                trackColor="#e2e8f0"
                displayValue={`${recoveryRate.toFixed(0)}%`}
                label="Recovered"
                sublabel={`${stats.paidCount} of ${stats.paidCount + stats.unpaidCount} invoices`}
              />
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Paid ({stats.paidCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Unpaid ({stats.unpaidCount})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
