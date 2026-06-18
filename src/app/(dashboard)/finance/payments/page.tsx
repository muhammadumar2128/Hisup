'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  History, 
  Search, 
  Download, 
  CreditCard,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function FinancePayments() {
  const [searchQuery, setSearchQuery] = useState('');

  const payments = [
    { id: '1', invoice: 'CHL-171235', student: 'Alex Johnson', amount: 38000, method: 'Easypaisa', date: '2026-06-05 14:30', ref: 'TXN-998877' },
    { id: '2', invoice: 'CHL-171236', student: 'Emily Brown', amount: 15000, method: 'Bank Transfer', date: '2026-06-06 09:15', ref: 'BK-554433' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground">View and export all student transaction records.</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
           <CardTitle className="text-lg">Recent Collections</CardTitle>
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Search by student or transaction ID..." className="pl-9 h-9" />
           </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{p.date}</TableCell>
                  <TableCell className="font-medium">{p.student}</TableCell>
                  <TableCell className="font-bold text-green-600">PKR {p.amount.toLocaleString()}</TableCell>
                  <TableCell>
                     <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">{p.method}</span>
                  </TableCell>
                  <TableCell className="font-mono text-[10px]">{p.ref}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Receipt</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
