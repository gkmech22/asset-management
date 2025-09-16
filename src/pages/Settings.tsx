// src/pages/Settings.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        Settings
      </h1>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configure your application settings here.</p>
        </CardContent>
      </Card>
    </div>
  );
};