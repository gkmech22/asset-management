// src/components/SettingsSidebar.tsx
import { NavLink } from 'react-router-dom';

export const SettingsSidebar = () => {
  return (
    <div className="w-48 border-r p-4">
      <nav className="space-y-2">
        <NavLink 
          to="/settings/device-management" 
          className={({ isActive }) => `block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Device Management
        </NavLink>
        <NavLink 
          to="/settings/account" 
          className={({ isActive }) => `block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Account
        </NavLink>
        <NavLink 
          to="/settings/notifications" 
          className={({ isActive }) => `block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Notifications
        </NavLink>
        <NavLink 
          to="/settings/user-management" 
          className={({ isActive }) => `block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
        >
          User Management
        </NavLink>
      </nav>
    </div>
  );
};