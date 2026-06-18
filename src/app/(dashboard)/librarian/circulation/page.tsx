'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Library, Search, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Label } from '@/components/ui/Label';

interface Transaction {
  id: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  book_copies: {
    barcode: string;
    books: {
      title: string;
    };
  };
  users: {
    email?: string;
    profiles: {
      first_name: string;
      last_name: string;
    }[];
  };
}

export default function LibrarianCirculationPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  
  const [issueData, setIssueData] = useState({ userEmail: '', barcode: '', days: 14 });
  const [returnData, setReturnData] = useState({ barcode: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const { data, error } = await supabase
        .from('library_transactions')
        .select(`
          id,
          issue_date,
          due_date,
          return_date,
          status,
          book_copies (
            barcode,
            books (
              title
            )
          ),
          users (
            email,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setTransactions(data as unknown as Transaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', issueData.userEmail)
        .single();
        
      if (userError || !userData) throw new Error('User not found. Check the email address.');

      // 2. Check if they have an active subscription
      const { data: subData } = await supabase
        .from('library_subscriptions')
        .select('*')
        .eq('student_id', userData.id)
        .eq('status', 'Active')
        .single();
        
      if (!subData) {
         // Some admins might want to override, but let's enforce it for now
         throw new Error('This user does not have an active library subscription.');
      }

      // 3. Find book copy by barcode
      const { data: copyData, error: copyError } = await supabase
        .from('book_copies')
        .select('id, status')
        .eq('barcode', issueData.barcode)
        .single();
        
      if (copyError || !copyData) throw new Error('Book barcode not found.');
      if (copyData.status !== 'Available') throw new Error('This book copy is currently not available.');

      // 4. Create transaction
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + issueData.days);

      const { error: txnError } = await supabase.from('library_transactions').insert({
        user_id: userData.id,
        copy_id: copyData.id,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'Issued'
      });
      if (txnError) throw txnError;

      // 5. Update book copy status
      const { error: updateError } = await supabase.from('book_copies')
        .update({ status: 'Issued' })
        .eq('id', copyData.id);
      if (updateError) throw updateError;

      alert('Book issued successfully!');
      setShowIssueModal(false);
      setIssueData({ userEmail: '', barcode: '', days: 14 });
      fetchTransactions();
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const processReturn = async (transactionId: string, copyBarcode: string) => {
    setIsSubmitting(true);
    try {
      // 1. Update transaction
      const { error: txnError } = await supabase
        .from('library_transactions')
        .update({ 
          status: 'Returned',
          return_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', transactionId);

      if (txnError) throw txnError;

      // 2. Find copy ID and update
      const { data: copyData } = await supabase
        .from('book_copies')
        .select('id')
        .eq('barcode', copyBarcode)
        .single();

      if (copyData) {
        await supabase
          .from('book_copies')
          .update({ status: 'Available' })
          .eq('id', copyData.id);
      }

      alert('Book returned successfully!');
      fetchTransactions();
    } catch (err: any) {
      alert('Error returning book: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeTxn = transactions.find(t => 
      t.book_copies?.barcode === returnData.barcode && 
      (t.status === 'Issued' || t.status === 'Overdue')
    );
    
    if (!activeTxn) {
      alert('No active issued record found for this barcode.');
      return;
    }

    await processReturn(activeTxn.id, returnData.barcode);
    setShowReturnModal(false);
    setReturnData({ barcode: '' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Issued':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="w-3 h-3"/> Issued</span>;
      case 'Returned':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3"/> Returned</span>;
      case 'Overdue':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertCircle className="w-3 h-3"/> Overdue</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{status}</span>;
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const bookTitle = tx.book_copies?.books?.title?.toLowerCase() || '';
    const barcode = tx.book_copies?.barcode?.toLowerCase() || '';
    const userName = (tx.users?.profiles?.[0]?.first_name + ' ' + tx.users?.profiles?.[0]?.last_name).toLowerCase();
    
    return bookTitle.includes(searchQuery.toLowerCase()) || 
           barcode.includes(searchQuery.toLowerCase()) ||
           userName.includes(searchQuery.toLowerCase());
  });

  const handleRapidReturn = async (barcode: string) => {
    const activeTxn = transactions.find(t => 
      t.book_copies?.barcode.toLowerCase() === barcode.toLowerCase() && 
      (t.status === 'Issued' || t.status === 'Overdue')
    );
    
    if (!activeTxn) {
      alert(`No active issued record found for barcode: ${barcode}`);
      return;
    }

    await processReturn(activeTxn.id, barcode);
    setReturnData({ barcode: '' });
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Library className="h-6 w-6 text-purple-600" />
            Circulation Desk
          </h1>
          <p className="text-muted-foreground mt-1">Manage book checkouts, returns, and track overdues.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowReturnModal(true)}
            variant="outline" 
            className="bg-white rounded-xl shadow-sm border-gray-200 dark:border-gray-700 dark:bg-gray-800"
          >
            Return Book
          </Button>
          <Button 
            onClick={() => setShowIssueModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm"
          >
            Issue Book
          </Button>
        </div>
      </div>

      {/* Rapid Scan Bar */}
      <Card className="rounded-2xl border-2 border-purple-100 bg-purple-50/30 dark:bg-purple-900/10 dark:border-purple-900/20">
         <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-3 text-purple-700 dark:text-purple-400 font-bold shrink-0">
               <div className="p-2 bg-purple-600 rounded-lg text-white">
                  <Library size={18} />
               </div>
               RAPID RETURN SCANNER
            </div>
            <div className="flex-1 w-full">
               <Input 
                 placeholder="Scan or type barcode and press Enter to return book..." 
                 className="bg-white dark:bg-gray-950 h-11 border-purple-200 focus:ring-purple-500 rounded-xl font-mono"
                 value={returnData.barcode}
                 onChange={e => setReturnData({ barcode: e.target.value })}
                 onKeyDown={e => {
                   if (e.key === 'Enter') {
                     handleRapidReturn(returnData.barcode);
                   }
                 }}
               />
            </div>
            <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Auto-process enabled</p>
         </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-800">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by book, barcode, or member..." 
                className="pl-9 bg-white dark:bg-gray-950 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-50/80 dark:bg-gray-900/80">
                <TableRow>
                  <TableHead className="font-semibold">Book Title & Barcode</TableHead>
                  <TableHead className="font-semibold">Member Name</TableHead>
                  <TableHead className="font-semibold">Issue Date</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-purple-50/50 dark:hover:bg-gray-800/50">
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{tx.book_copies?.books?.title || 'Unknown Book'}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">#{tx.book_copies?.barcode || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-700 dark:text-gray-300">
                      {tx.users?.profiles?.[0]?.first_name} {tx.users?.profiles?.[0]?.last_name}
                      <div className="text-xs text-gray-400">{tx.users?.email}</div>
                    </TableCell>
                    <TableCell className="text-gray-500">{new Date(tx.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-gray-500">{new Date(tx.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {getStatusBadge(tx.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.status === 'Issued' || tx.status === 'Overdue' ? (
                        <Button 
                          onClick={() => processReturn(tx.id, tx.book_copies?.barcode)}
                          variant="ghost" 
                          size="sm" 
                          disabled={isSubmitting}
                          className="text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700"
                        >
                          Mark Returned
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 mr-4">Completed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Library className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No transactions found</h3>
              <p className="text-gray-500 max-w-sm mt-2">
                {searchQuery ? "No circulation records matched your search." : "No books have been issued yet. Click 'Issue Book' to start a transaction."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <CardTitle>Issue Book to Member</CardTitle>
              <button onClick={() => setShowIssueModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleIssueBook} className="space-y-4">
                <div className="space-y-2">
                  <Label>User Email</Label>
                  <Input 
                    required 
                    type="email"
                    value={issueData.userEmail} 
                    onChange={e => setIssueData({...issueData, userEmail: e.target.value})} 
                    placeholder="student@hitecuni.edu.pk" 
                  />
                  <p className="text-xs text-gray-500">The user must have an active library subscription.</p>
                </div>
                <div className="space-y-2">
                  <Label>Book Barcode</Label>
                  <Input 
                    required 
                    value={issueData.barcode} 
                    onChange={e => setIssueData({...issueData, barcode: e.target.value})} 
                    placeholder="e.g. B001" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Issue Duration (Days)</Label>
                  <Input 
                    required 
                    type="number"
                    min="1"
                    max="90"
                    value={issueData.days} 
                    onChange={e => setIssueData({...issueData, days: parseInt(e.target.value)})} 
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowIssueModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                    {isSubmitting ? 'Processing...' : 'Issue Book'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Return Book Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <CardTitle>Return Book</CardTitle>
              <button onClick={() => setShowReturnModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleReturnFromModal} className="space-y-4">
                <div className="space-y-2">
                  <Label>Scan Barcode</Label>
                  <Input 
                    required 
                    value={returnData.barcode} 
                    onChange={e => setReturnData({...returnData, barcode: e.target.value})} 
                    placeholder="e.g. B001" 
                    autoFocus
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowReturnModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900">
                    {isSubmitting ? 'Processing...' : 'Confirm Return'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
