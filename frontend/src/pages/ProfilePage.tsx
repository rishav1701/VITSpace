import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToastContext } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle,
  Mail,
  GraduationCap,
  ShieldCheck,
  Building2,
  LogOut,
  Calendar,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'info');
      navigate('/login');
    } catch {
      showToast('Error during logout', 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <UserCircle className="w-6 h-6 text-blue-500" />
          User Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Account details and academic metadata stored in Oracle Database.
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
              {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.name || user.username}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {user.reg_no ? `Reg No: ${user.reg_no}` : `Username: ${user.username}`}
              </p>
            </div>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                user.role === 'admin'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}
            >
              {user.role === 'admin' ? (
                <>
                  <ShieldCheck className="w-4 h-4" /> System Administrator
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" /> Registered Student
                </>
              )}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              Registered Email
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {user.mail || `${user.username}@vitstudent.ac.in`}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Department
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {user.dept || (user.role === 'admin' ? 'Campus IT / Facilities' : 'General')}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              Assigned Block
            </div>
            <div className="text-sm font-semibold text-slate-200">
              PRP Block (Periyar Building)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Academic Term
            </div>
            <div className="text-sm font-semibold text-slate-200">Winter Semester 2026</div>
          </div>
        </div>

        {/* Role Permissions summary */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-xs font-bold text-white mb-2">Role Permissions & Access</div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            {user.role === 'admin' ? (
              <>
                <li>Full read and write permissions on ROOM, ROOM_SCHEDULE, and STUDENTS tables.</li>
                <li>Ability to create, update, and remove classroom entries across all 7 floors.</li>
                <li>Manage weekly timetable slot mappings (Slots 1-8).</li>
                <li>Access to system metrics, floor capacity charts, and audit logs.</li>
              </>
            ) : (
              <>
                <li>Real-time search and query access on PRP classroom availability.</li>
                <li>View complete weekly timetables and room details for all floors.</li>
                <li>Student identity bound to academic registration records.</li>
              </>
            )}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/20 text-xs font-bold transition-all shadow-lg shadow-rose-600/10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of VITSpace
          </button>
        </div>
      </div>
    </div>
  );
};
