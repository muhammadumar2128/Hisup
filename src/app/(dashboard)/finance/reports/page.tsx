'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart3, TrendingUp, Users, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function FinanceReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">Analytical overview of university revenue and collections.</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export All Data</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-green-600" /> Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800">
             <p className="text-gray-500 text-sm italic">Revenue chart visualization will appear here.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-blue-600" /> Collection by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800">
             <p className="text-gray-500 text-sm italic">Collection breakdown chart will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
