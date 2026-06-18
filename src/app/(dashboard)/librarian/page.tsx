'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BookOpen, BookUp, AlertCircle, Clock } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Librarian Dashboard</h1>
        <p className="text-muted-foreground">Manage library resources, circulation, and user fines.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse bg-gray-50 dark:bg-gray-800 h-32"></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique titles in catalog</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <BookUp className="h-4 w-4 text-muted-foreground text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLoans}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently checked out</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Returns</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdueReturns}</div>
              <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Fines</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {stats.unpaidFines.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
