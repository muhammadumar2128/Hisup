'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';

export default function FinanceInvoices() {
  const [searchQuery, setSearchQuery] = useState('');

  const invoices = [
    { id: '1', challan: 'CHL-171234-STUD1', student: 'Sarah Smith', amount: 45000, due_date: '2026-06-15', status: 'Unpaid' },
    { id: '2', challan: 'CHL-171235-STUD2', student: 'Alex Johnson', amount: 38000, due_date: '2026-06-10', status: 'Paid' },
    { id: '3', challan: 'CHL-171236-STUD3', student: 'Emily Brown', amount: 52000, due_date: '2026-05-30', status: 'Overdue' },
    { id: '4', challan: 'CHL-171237-STUD4', student: 'Michael Lee', amount: 45000, due_date: '2026-06-15', status: 'Partial' },
    { id: '5', challan: 'CHL-171238-STUD5', student: 'Olivia Wilson', amount: 45000, due_date: '2026-06-15', status: 'Unpaid' },
  ];

  const filtered = invoices.filter(inv => 
    inv.student.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.challan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
          <p className="text-muted-foreground">Monitor student billing and transaction history.</p>
        </div>
        <div className="flex space-x-2">
           <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Report</Button>
           <Button className="bg-blue-600"><PlusCircle className="mr-2 h-4 w-4" /> Generate Batch</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard title="Total Receivable" value="PKR 2.4M" icon={<FileText className="text-blue-600"/>} />
         <StatCard title="Total Collected" value="PKR 1.8M" icon={<CheckCircle2 className="text-green-600"/>} />
         <StatCard title="Pending" value="PKR 450K" icon={<Clock className="text-yellow-600"/>} />
         <StatCard title="Overdue" value="PKR 150K" icon={<AlertCircle className="text-red-600"/>} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search by student name or challan..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Challan Number</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs font-bold">{inv.challan}</TableCell>
                  <TableCell className="font-medium">{inv.student}</TableCell>
                  <TableCell>PKR {inv.amount.toLocaleString()}</TableCell>
                  <TableCell>{inv.due_date}</TableCell>
                  <TableCell>
                     <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                        inv.status === 'Overdue' ? 'bg-red-100 text-red-700' : 
                        inv.status === 'Partial' ? 'bg-blue-100 text-blue-700' : 
                        'bg-yellow-100 text-yellow-700'
                     }`}>
                        {inv.status}
                     </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Record Payment</Button>
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

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">{icon}</div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">{title}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
