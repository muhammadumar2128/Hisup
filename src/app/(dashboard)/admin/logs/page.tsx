'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  Activity, 
  Search, 
  User, 
  Database,
  Eye,
  Download,
  AlertCircle
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  timestamp: string;
  user_id?: string;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select(`id, action, table_name, timestamp, user_id`)
          .order('timestamp', { ascending: false });

        if (error) throw error;
        setLogs((data as any) || []);
      } catch (err: any) {
        console.error("Error fetching logs:", err);
        if (err.code === 'PGRST205' || err.message?.includes('schema cache')) {
          setError("System cache issue: Please run the fix script in Supabase.");
        } else {
          setError(err.message || "An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const exportCSV = () => {
    const headers = ['Timestamp', 'User ID', 'Action', 'Table'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.user_id || 'System',
      log.action,
      log.table_name
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    const userId = (log.user_id || '').toLowerCase();
    const tableName = log.table_name.toLowerCase();
    return userId.includes(searchQuery.toLowerCase()) || tableName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Audit Logs</h1>
          <p className="text-muted-foreground">Monitor all administrative and database transactions for security.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="rounded-xl flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-800">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 pb-3 flex flex-col md:flex-row items-center justify-between gap-4">
           <CardTitle className="text-lg flex items-center">
              <Activity className="mr-2 h-5 w-5 text-blue-600" />
              Transaction History
           </CardTitle>
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search logs by user or table name..." 
                className="pl-9 h-10 rounded-xl bg-white dark:bg-gray-950" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-bold">Database Sync Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="p-12 text-center animate-pulse text-gray-400">Loading audit history...</div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/80 dark:bg-gray-900/80">
                <TableRow>
                  <TableHead className="font-semibold">Timestamp</TableHead>
                  <TableHead className="font-semibold">Initiated By</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">Affected Table</TableHead>
                  <TableHead className="text-right font-semibold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-blue-50/30 dark:hover:bg-gray-800/50">
                    <TableCell className="text-xs font-mono text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                       <div className="flex items-center text-xs">
                         <User size={14} className="mr-2 text-gray-400"/> 
                         {log.user_id || 'System Process'}
                       </div>
                    </TableCell>
                    <TableCell>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                          'bg-green-100 text-green-700'
                       }`}>
                          {log.action}
                       </span>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-gray-400">
                       <Database size={12} className="inline mr-1 opacity-50"/> {log.table_name}
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors text-blue-600">
                        <Eye size={16} />
                      </button>
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
