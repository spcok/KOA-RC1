import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Users, Database, MapPin, 
  Phone, Utensils, Building2, FileText, Activity, ShieldCheck, BrainCircuit, GraduationCap, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/src/store/authStore';

const SettingsLayout: React.FC = () => {
  const { profile: currentUser } = useAuthStore();

  const navItems = [
    { id: 'org', path: '/settings/org', label: 'Organisation', icon: Building2 },
    { id: 'users', path: '/settings/users', label: 'Access Control', icon: Users },
    { id: 'training', path: '/settings/training', label: 'Staff Training', icon: GraduationCap },
    { id: 'directory', path: '/settings/directory', label: 'Directory', icon: Phone },
    { id: 'lists', path: '/settings/lists', label: 'Operational Lists', icon: Utensils },
    { id: 'documents', path: '/settings/documents', label: 'Statutory Files', icon: FileText },
    { id: 'diagnostics', path: '/settings/diagnostics', label: 'Statutory Audit', icon: ShieldCheck },
    { id: 'intelligence', path: '/settings/intelligence', label: 'Data Intelligence', icon: BrainCircuit },
    { id: 'migration', path: '/settings/migration', label: 'Migration', icon: Database },
    { id: 'system', path: '/settings/system', label: 'System Health', icon: Activity },
  ].filter(item => {
    const role = currentUser?.role?.toUpperCase();
    if ((item.id === 'directory' || item.id === 'org') && (role === 'KEEPER' || role === 'SENIOR KEEPER')) {
        return false;
    }
    if (item.id === 'system' && currentUser?.role?.toUpperCase() !== 'ADMIN') {
        return false;
    }
    return true;
  });

  return (
    <div className="flex h-full max-h-[calc(100vh-4rem)] overflow-hidden bg-white animate-in fade-in duration-500">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <SettingsIcon size={24} className="text-slate-600" /> Settings
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">System Configuration</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) => `w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                            isActive ? 'bg-slate-900 text-white shadow-lg' : 'bg-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        {({ isActive }) => (
                          <>
                            <item.icon size={18} />
                            <span className="text-xs font-bold uppercase tracking-wide">{item.label}</span>
                            {isActive && <ChevronRight size={14} className="ml-auto text-emerald-400"/>}
                          </>
                        )}
                    </NavLink>
                ))}
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-auto p-8 bg-slate-100/50">
            <Outlet />
        </div>
    </div>
  );
};

export default SettingsLayout;
