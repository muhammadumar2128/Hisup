'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface Fine {
  id: string;
  fine_amount: number;
  status: string;
  library_transactions: {
    due_date: string;
    return_date: string | null;
    book_copies: {
      books: {
        title: string;
      };
    };
    users: {
      profiles: {
        first_name: string;
        last_name: string;
      }[];
    };
  };
}

export default function LibrarianFinesPage() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFines();
  }, []);

  async function fetchFines() {
    try {
      const { data, error } = await supabase
        .from('library_fines')
        .select(`
          id,
          fine_amount,
          status,
          library_transactions (
            due_date,
            return_date,
            book_copies (
              books (
                title
              )
            ),
            users (
              profiles (
                first_name,
                last_name
              )
            )
          )
        `);

      if (error) throw error;
      setFines(data as unknown as Fine[]);
    } catch (error) {
      console.error('Error fetching fines:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCollect = async (fineId: string) => {
    if (!confirm('Are you sure you want to mark this fine as Paid?')) return;
    
    setProcessingId(fineId);
    try {
      const { error } = await supabase
        .from('library_fines')
        .update({ status: 'Paid' })
        .eq('id', fineId);

      if (error) throw error;
      
      // Update local state instantly
      setFines(fines.map(f => f.id === fineId ? { ...f, status: 'Paid' } : f));
      alert('Fine marked as paid successfully!');
    } catch (error: any) {
      console.error('Error collecting fine:', error);
      alert('Failed to collect fine: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const totalUnpaid = fines
    .filter(f => f.status === 'Unpaid')
    .reduce((sum, fine) => sum + Number(fine.fine_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            Fine Management
          </h1>
          <p className="text-muted-foreground mt-1">Track and collect overdue library fines.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Unpaid Fines</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {totalUnpaid.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-800">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 pb-4">
          <CardTitle className="text-lg">Fine Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : fines.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-50/80 dark:bg-gray-900/80">
                <TableRow>
                  <TableHead className="font-semibold">Member</TableHead>
                  <TableHead className="font-semibold">Book</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map((fine) => (
                  <TableRow key={fine.id} className="hover:bg-red-50/50 dark:hover:bg-gray-800/50">
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                      {fine.library_transactions?.users?.profiles?.[0]?.first_name} {fine.library_transactions?.users?.profiles?.[0]?.last_name}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {fine.library_transactions?.book_copies?.books?.title}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {fine.library_transactions?.due_date ? new Date(fine.library_transactions.due_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="font-bold text-gray-900 dark:text-gray-100">
                      Rs. {Number(fine.fine_amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {fine.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3"/> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <AlertCircle className="w-3 h-3"/> Unpaid
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {fine.status === 'Unpaid' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleCollect(fine.id)}
                          disabled={processingId === fine.id}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm"
                        >
                          {processingId === fine.id ? 'Processing...' : 'Collect'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No fines recorded</h3>
              <p className="text-gray-500 max-w-sm mt-2">
                There are currently no overdue fines in the system. 
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
