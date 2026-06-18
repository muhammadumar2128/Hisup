'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Settings as SettingsIcon, Shield, Bell, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure global portal parameters and security defaults.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center"><Shield className="mr-2 h-5 w-5 text-blue-600" /> Security & Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                   <p className="font-medium">Force Email Verification</p>
                   <p className="text-xs text-gray-500">Require users to confirm email before dashboard access.</p>
                </div>
                <div className="h-6 w-11 bg-gray-200 rounded-full relative"><div className="h-5 w-5 bg-white rounded-full absolute top-0.5 left-1 shadow-sm"></div></div>
             </div>
             <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                   <p className="font-medium">Automatic Invoicing</p>
                   <p className="text-xs text-gray-500">Generate challans automatically upon registration approval.</p>
                </div>
                <div className="h-6 w-11 bg-blue-600 rounded-full relative"><div className="h-5 w-5 bg-white rounded-full absolute top-0.5 right-1 shadow-sm"></div></div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
