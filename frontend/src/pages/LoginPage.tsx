import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToastContext } from '../context/ToastContext';
import {
  Building2,
  Lock,
  User as UserIcon,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(username.trim(), password);
      showToast(`Welcome back, ${user.name || user.username}!`, 'success');
      const origin = (location.state as any)?.from?.pathname;
      if (origin) {
        navigate(origin, { replace: true });
      } else {
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid credentials or connection error';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (role: 'student' | 'admin') => {
    setActiveTab(role);
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('21BCE0001');
      setPassword('student123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-4 glow-blue">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            VIT<span className="text-blue-500">Space</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            PRP Block Classroom Availability System — VIT Vellore
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Administrator
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {activeTab === 'student' ? 'Registration Number' : 'Admin Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'student' ? 'e.g. 21BCE0001' : 'e.g. admin'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                activeTab === 'student'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
              } disabled:opacity-50`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In as {activeTab === 'student' ? 'Student' : 'Admin'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Helper */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick Test Credentials
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('student')}
                className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/30 text-[11px] text-slate-300 hover:text-white transition-colors text-left"
              >
                <div className="font-semibold text-blue-400">Demo Student</div>
                <div className="text-[10px] text-slate-400">21BCE0001</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-[11px] text-slate-300 hover:text-white transition-colors text-left"
              >
                <div className="font-semibold text-indigo-400">Demo Admin</div>
                <div className="text-[10px] text-slate-400">admin / admin123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Department of Computer Science & Engineering • VIT Vellore
        </p>
      </div>
    </div>
  );
};
