'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { BookOpen, Search, Plus, Layers, X } from 'lucide-react';
import { Label } from '@/components/ui/Label';

interface Book {
  id: string;
  title: string;
  isbn: string;
  publisher: string;
  publication_year?: number;
  category?: string;
}

export default function LibrarianCatalogPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', isbn: '', publisher: '', barcode: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching catalog:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Insert Book
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .insert({
          title: newBook.title,
          isbn: newBook.isbn,
          publisher: newBook.publisher
        })
        .select()
        .single();

      if (bookError) throw bookError;

      // 2. Insert Copy (if barcode provided)
      if (newBook.barcode && bookData) {
        const { error: copyError } = await supabase
          .from('book_copies')
          .insert({
            book_id: bookData.id,
            barcode: newBook.barcode,
            status: 'Available'
          });
        if (copyError) console.error('Error adding copy:', copyError);
      }

      alert('Book added successfully!');
      setShowAddModal(false);
      setNewBook({ title: '', isbn: '', publisher: '', barcode: '' });
      fetchBooks();
    } catch (error: any) {
      console.error('Error adding book:', error);
      alert('Failed to add book: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.isbn && book.isbn.includes(searchQuery)) ||
    (book.category && book.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Library Catalog
          </h1>
          <p className="text-muted-foreground mt-1">Manage books, ISBNs, and library categories.</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm rounded-xl"
        >
          <Plus className="h-4 w-4" /> Add New Book
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-800">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg">Book Inventory</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by title, ISBN, or category..." 
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredBooks.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-50/80 dark:bg-gray-900/80">
                <TableRow>
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">ISBN</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Publisher</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50">
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{book.title}</TableCell>
                    <TableCell className="text-gray-500">{book.isbn || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {book.category || 'General'}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">{book.publisher || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Layers className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No books found</h3>
              <p className="text-gray-500 max-w-sm mt-2">
                {searchQuery ? "No books matched your search criteria." : "The catalog is currently empty. Click 'Add New Book' to start building the inventory."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowAddModal(true)} className="mt-6 bg-blue-600 text-white rounded-xl shadow-sm">
                  Add First Book
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Book Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <CardTitle>Add New Book</CardTitle>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddBook} className="space-y-4">
                <div className="space-y-2">
                  <Label>Book Title</Label>
                  <Input 
                    required 
                    value={newBook.title} 
                    onChange={e => setNewBook({...newBook, title: e.target.value})} 
                    placeholder="e.g. Introduction to Physics" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>ISBN</Label>
                  <Input 
                    required 
                    value={newBook.isbn} 
                    onChange={e => setNewBook({...newBook, isbn: e.target.value})} 
                    placeholder="e.g. 978-3-16-148410-0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Publisher</Label>
                  <Input 
                    value={newBook.publisher} 
                    onChange={e => setNewBook({...newBook, publisher: e.target.value})} 
                    placeholder="e.g. O'Reilly Media" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial Copy Barcode (Optional)</Label>
                  <Input 
                    value={newBook.barcode} 
                    onChange={e => setNewBook({...newBook, barcode: e.target.value})} 
                    placeholder="e.g. B1001" 
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? 'Saving...' : 'Save Book'}
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

