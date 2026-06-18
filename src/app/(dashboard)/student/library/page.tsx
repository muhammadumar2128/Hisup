'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { BookMarked, CheckCircle, AlertCircle, Library, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface LibraryTransaction {
  id: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  book_copies: {
    barcode: string;
    books: {
      title: string;
      isbn: string;
      publisher: string;
    }
  }
}

interface Subscription {
  id: string;
  status: string;
  end_date: string;
}

interface Book {
  id: string;
  title: string;
  author: string; // Not in schema, but good for UI. We'll use publisher for now.
  isbn: string;
  publisher: string;
  category: string;
  available_copies: { id: string, barcode: string }[];
}

export default function StudentLibrary() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLibraryData();
  }, [user]);

  async function fetchLibraryData() {
    if (!user) return;
    
    try {
      // 1. Fetch Subscription Status
      const { data: subData } = await supabase
        .from('library_subscriptions')
        .select('*')
        .eq('student_id', user.id)
        .eq('status', 'Active')
        .limit(1)
        .single();
        
      if (subData) {
        setSubscription(subData);
      }

      // 2. Fetch Transactions
      const { data: txnData, error: txnError } = await supabase
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
              title,
              isbn,
              publisher
            )
          )
        `)
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false });

      if (txnError && txnError.code !== 'PGRST116') throw txnError;
      // @ts-ignore
      setTransactions(txnData || []);

      // 3. Fetch Available Books Catalog
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          id, title, isbn, publisher,
          book_copies ( id, barcode, status )
        `);

      if (booksError) throw booksError;

      // Transform data to easily show available copies
      if (booksData) {
        const formattedBooks = booksData.map((book: any) => ({
          ...book,
          available_copies: book.book_copies.filter((c: any) => c.status === 'Available')
        })).filter((book: any) => book.available_copies.length > 0); // Only show books with available copies
        
        setBooks(formattedBooks);
      }

    } catch (error: any) {
      console.error("Error fetching library data:", error);
      alert("Error loading library: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSubscribe = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      const challan = 'LIB-' + Math.floor(Date.now() / 1000) + '-' + user.id.substring(0, 4);
      const { data: sem } = await supabase.from('semesters').select('id').eq('is_active', true).limit(1).single();
      const semId = sem ? sem.id : '00000000-0000-0000-0000-000000000000';
      
      const { error: invError } = await supabase.from('invoices').insert({
        student_id: user.id,
        semester_id: semId,
        total_amount: 5000,
        due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'Unpaid',
        challan_number: challan
      });

      if (invError) throw invError;
      alert('Subscription requested! An invoice for PKR 5000 has been generated. Please pay it from your Fee dashboard to activate your subscription.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate subscription invoice: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBorrowBook = async (book: Book) => {
    if (!user || !subscription || new Date(subscription.end_date) < new Date()) {
      alert("You need an active library subscription to borrow books.");
      return;
    }

    if (book.available_copies.length === 0) {
      alert("No copies available right now.");
      return;
    }

    // Grab the first available copy
    const copyToBorrow = book.available_copies[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // Borrow for 14 days

    try {
      setProcessing(true);

      // 1. Insert transaction
      const { error: txnError } = await supabase.from('library_transactions').insert({
        user_id: user.id,
        copy_id: copyToBorrow.id,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'Issued'
      });

      if (txnError) throw txnError;

      // 2. Update copy status
      const { error: copyError } = await supabase.from('book_copies')
        .update({ status: 'Issued' })
        .eq('id', copyToBorrow.id);

      if (copyError) throw copyError;

      alert(`Success! You have borrowed '${book.title}'. Due date is ${dueDate.toLocaleDateString()}.`);
      
      // Refresh UI
      fetchLibraryData();

    } catch (err: any) {
      console.error("Error borrowing book:", err);
      alert("Failed to borrow book. It might have just been taken by someone else.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReturnBook = async (transaction: LibraryTransaction) => {
    if (!confirm(`Are you sure you want to return '${transaction.book_copies?.books?.title}'?`)) return;
    
    setProcessing(true);
    try {
      // 1. Update the transaction record
      const { error: txnError } = await supabase
        .from('library_transactions')
        .update({ 
          status: 'Returned',
          return_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', transaction.id);

      if (txnError) throw txnError;

      // 2. Extract the copy ID using a separate query since we only have the barcode in the transaction object
      const { data: copyData } = await supabase
        .from('book_copies')
        .select('id')
        .eq('barcode', transaction.book_copies.barcode)
        .single();

      if (copyData) {
        // 3. Make the book available again
        const { error: copyError } = await supabase
          .from('book_copies')
          .update({ status: 'Available' })
          .eq('id', copyData.id);
          
        if (copyError) console.error("Warning: Failed to update book copy status:", copyError);
      }

      alert('Book returned successfully! Thank you.');
      fetchLibraryData(); // Refresh the UI
    } catch (err: any) {
      console.error("Error returning book:", err);
      alert('Failed to return book: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>;
  }

  const isSubActive = subscription && new Date(subscription.end_date) > new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Library</h1>
        <p className="text-muted-foreground">Track your issued books, due dates, and circulation history.</p>
      </div>

      {/* Subscription Card */}
      <Card className={isSubActive ? 'border-green-200 bg-green-50/30' : 'border-blue-200 bg-blue-50/30'}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${isSubActive ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                {isSubActive ? <CheckCircle size={24} /> : <BookMarked size={24} />}
              </div>
              <div>
                <h3 className="font-semibold text-lg">Monthly Library Membership</h3>
                <p className="text-sm text-muted-foreground">
                  {isSubActive 
                    ? `Your subscription is active until ${new Date(subscription.end_date).toLocaleDateString()}` 
                    : 'Subscribe to access physical books, digital archives, and study rooms.'}
                </p>
              </div>
            </div>
            {!isSubActive && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-900">PKR 5000</span>
                  <span className="text-xs text-muted-foreground block">/ month</span>
                </div>
                <Button 
                  onClick={handleSubscribe} 
                  disabled={processing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? 'Processing...' : 'Subscribe Now'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!isSubActive && (
        <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md flex items-center space-x-2">
          <AlertCircle size={18} />
          <span className="text-sm">You must have an active subscription to borrow new books from the library catalog.</span>
        </div>
      )}

      {/* Book Catalog */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Library Catalog</CardTitle>
            <CardDescription>Browse and borrow available books</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              type="search" 
              placeholder="Search by title..." 
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredBooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Library className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p>No books available in the catalog right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map(book => (
                <div key={book.id} className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">{book.available_copies.length} Available</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">Publisher: {book.publisher || 'Unknown'}</p>
                    <p className="text-xs text-gray-400 mb-4">ISBN: {book.isbn}</p>
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!isSubActive || processing}
                    onClick={() => handleBorrowBook(book)}
                    variant={isSubActive ? 'default' : 'outline'}
                  >
                    {isSubActive ? 'Borrow Book' : 'Subscription Required'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Circulation History */}
      <Card>
        <CardHeader>
          <CardTitle>Circulation History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">You have no library transactions.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Barcode (ISBN)</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium">{txn.book_copies?.books?.title}</TableCell>
                    <TableCell>{txn.book_copies?.barcode} ({txn.book_copies?.books?.isbn || 'N/A'})</TableCell>
                    <TableCell>{new Date(txn.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell className={new Date(txn.due_date) < new Date() && txn.status === 'Issued' ? 'text-red-600 font-medium' : ''}>
                      {new Date(txn.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        txn.status === 'Returned' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' : 
                        txn.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {txn.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {txn.status !== 'Returned' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleReturnBook(txn)}
                          disabled={processing}
                          className="hover:bg-red-50 hover:text-red-600 border-red-200"
                        >
                          Return Book
                        </Button>
                      )}
                      {txn.status === 'Returned' && (
                        <span className="text-xs text-gray-400">Returned on {txn.return_date ? new Date(txn.return_date).toLocaleDateString() : 'N/A'}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

