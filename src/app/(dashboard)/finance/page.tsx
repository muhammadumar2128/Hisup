'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
    return <div className="animate-pulse space-y-6 p-6">
      <div className="h-10 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="h-32 bg-gray-200 rounded-xl"></div>
      </div>
    </div>;
  }

  const chartData = [
    { name: 'Collected', value: stats.totalPaid },
    { name: 'Pending', value: stats.totalPending },
  ];

  const statusData = [
    { name: 'Paid', value: stats.paidCount },
    { name: 'Unpaid', value: stats.unpaidCount },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Overview</h1>
        <p className="text-muted-foreground">Real-time revenue tracking and invoice status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <Banknote size={16} />
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Rs. {stats.totalInvoiced.toLocaleString()}</div>
            <p className="text-xs text-blue-200 mt-1">Gross accounts receivable</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              Collected Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rs. {stats.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.totalInvoiced > 0 ? ((stats.totalPaid / stats.totalInvoiced) * 100).toFixed(1) : '0.0'}% recovery rate</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock size={16} className="text-orange-600" />
              Pending Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Rs. {stats.totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Outstanding dues</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              Unpaid Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unpaidCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Require follow-up</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 rounded-2xl border-0 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-50 dark:border-gray-800">
             <CardTitle className="text-lg">Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-6">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" />
                   <Tooltip 
                     formatter={(value: any) => `Rs. ${Number(value || 0).toLocaleString()}`}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={40} />
                </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 rounded-2xl border-0 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-50 dark:border-gray-800">
             <CardTitle className="text-lg">Invoice Status Ratio</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center">
             <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-green-500"></div>
                   <span className="text-sm font-medium">Paid ({stats.paidCount})</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                   <span className="text-sm font-medium">Unpaid ({stats.unpaidCount})</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
