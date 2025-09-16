// src/pages/Settings.tsx
import { Outlet } from 'react-router-dom';
import { SettingsSidebar } from '@/components/SettingsSidebar';

export const Settings = () => {
  return (
    <div className="flex min-h-screen">
      <SettingsSidebar />
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
};