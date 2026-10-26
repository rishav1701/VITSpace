import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Search,
  Building,
  CalendarDays,
  Users,
  UserCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = isAdmin
    ? [
        { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Find Availability', to: '/find-rooms', icon: Search },
        { name: 'Manage Rooms', to: '/admin/rooms', icon: Building },
        { name: 'Manage Schedules', to: '/admin/schedules', icon: CalendarDays },
        { name: 'Student Directory', to: '/admin/students', icon: Users },
        { name: 'My Profile', to: '/profile', icon: UserCircle },
      ]
    : [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { name: 'Find Available Rooms', to: '/find-rooms', icon: Search },
        { name: 'PRP Room Directory', to: '/rooms', icon: Building },
        { name: 'My Profile', to: '/profile', icon: UserCircle },
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900/60 border-r border-slate-800/80 p-4">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/60 md:hidden">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
        <button
          onClick={onCloseMobile}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1.5 flex-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {isAdmin ? 'Admin Console' : 'PRP Navigation'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* PRP Block Info box */}
      <div className="mt-auto pt-4 border-t border-slate-800/60">
        <div className="rounded-xl p-3 bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-indigo-950/40 border border-blue-500/15">
          <div className="flex items-center gap-2 mb-1 text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold">PRP Block Fact</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            PRP accommodates 7 floors of classrooms & computer labs with standardized slots.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
