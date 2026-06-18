'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { ShieldCheck, Search, Users, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface Member {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
    users: { email: string } | { email: string }[] | any;
    student_profiles: {
      invoices: {
        total_amount: number;
        status: string;
        challan_number: string;
        payments: {
          payment_date: string;
        }[]
      }[]
    } | {
      invoices: {
        total_amount: number;
        status: string;
        challan_number: string;
        payments: {
          payment_date: string;
        }[]
      }[]
    }[] | any;
  }
}

export default function LibraryMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMembers();

    const channel = supabase
      .channel('library-sub-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library_subscriptions' }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from('library_subscriptions')
        .select(`
          id,
          status,
          start_date,
          end_date,
          profiles (
            first_name,
            last_name,
            phone,
            users!inner ( email ),
            student_profiles (
              invoices (
                total_amount,
                status,
                challan_number,
                payments ( payment_date )
              )
            )
          )
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setMembers(data as any || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = members.filter(m => {
    const name = `${m.profiles?.first_name} ${m.profiles?.last_name}`.toLowerCase();
    
    // Handle email whether it's an object or array (1:1 relation might return an array if improperly configured, but usually an object)
    let email = '';
    if (Array.isArray(m.profiles?.users)) {
      email = m.profiles?.users[0]?.email || '';
    } else if (m.profiles?.users?.email) {
      email = m.profiles.users.email;
    }
    email = email.toLowerCase();
    
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            Library Membership Desk
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time feed of students who have paid their library dues.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-800">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg">Member Roster & Payments</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name or email..." 
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredMembers.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-50/80 dark:bg-gray-900/80">
                <TableRow>
                  <TableHead className="font-semibold">Student & Email</TableHead>
                  <TableHead className="font-semibold text-center">Amount Paid</TableHead>
                  <TableHead className="font-semibold text-center">Paid At</TableHead>
                  <TableHead className="font-semibold">Subscription Period</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  
                  // Extract email safely
                  let displayEmail = JSON.stringify(member.profiles?.users || member.profiles || 'No Profiles');
                  if (Array.isArray(member.profiles?.users)) {
                     displayEmail = member.profiles?.users[0]?.email || displayEmail;
                  } else if (member.profiles?.users?.email) {
                     displayEmail = member.profiles.users.email;
                  }

                  // Handle student_profiles being an object (1:1) or array
                  let studentProfile = Array.isArray(member.profiles?.student_profiles) 
                    ? member.profiles?.student_profiles[0] 
                    : member.profiles?.student_profiles;

                  // Find the Paid Library Invoice
                  const libInvoice = studentProfile?.invoices?.find(
                    (inv: any) => inv.challan_number?.startsWith('LIB-') && inv.status === 'Paid'
                  );
                  
                  const amount = libInvoice?.total_amount || '500';
                  
                  // Extract payment date
                  let paymentDate = member.start_date;
                  if (libInvoice?.payments && Array.isArray(libInvoice.payments) && libInvoice.payments.length > 0) {
                    paymentDate = libInvoice.payments[0].payment_date;
                  } else if (libInvoice?.payments?.payment_date) {
                    paymentDate = libInvoice.payments.payment_date;
                  }
                  
                  const paidAt = new Date(paymentDate).toLocaleDateString();

                  const isExpired = new Date(member.end_date) < new Date();
                  
                  return (
                    <TableRow key={member.id} className="hover:bg-green-50/50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                          {member.profiles?.first_name} {member.profiles?.last_name}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {displayEmail}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-black text-green-700">
                        <div className="flex items-center justify-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {amount}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-gray-500 font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {paidAt}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">
                        {new Date(member.start_date).toLocaleDateString()} — {new Date(member.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {isExpired ? 'EXPIRED' : 'PAID & ACTIVE'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No members found</h3>
              <p className="text-gray-500 max-w-sm mt-2">
                When a student pays their library fee, they will appear here automatically with their payment receipt info.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
