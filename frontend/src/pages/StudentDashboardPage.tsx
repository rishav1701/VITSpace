import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardApi } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import type { StudentDashboard } from '../types';
import {
  Building2,
  Search,
  BookOpen,
  Laptop,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  Loader2,
  CalendarCheck2,
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<StudentDashboard | null>(() =>
    offlineStorage.getStudentDashboard(user?.name || 'Rishav Raj', user?.dept || 'CSE')
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardApi.student();
        setDashboard(res.data);
      } catch (err) {
        console.error('Error fetching student dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Quick Find Now helper
  const handleFindNow = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const now = new Date();
    let day = days[now.getDay()];
    if (day === 'SUN') day = 'MON';

    const currentHour = now.getHours();
    let slot = 1;
    if (currentHour >= 8 && currentHour < 9) slot = 1;
    else if (currentHour >= 9 && currentHour < 10) slot = 2;
    else if (currentHour >= 10 && currentHour < 11) slot = 3;
    else if (currentHour >= 11 && currentHour < 12) slot = 4;
    else if (currentHour >= 12 && currentHour < 13) slot = 5;
    else if (currentHour >= 14 && currentHour < 15) slot = 6;
    else if (currentHour >= 15 && currentHour < 16) slot = 7;
    else if (currentHour >= 16) slot = 8;

    navigate(`/find-rooms?day=${day}&slot=${slot}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIT Vellore • PRP Academic Block</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.name || user?.username || 'VITian'}!
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Need an empty classroom for study groups, project discussions, or hackathons? Search
            real-time PRP block schedules backed directly by Oracle DB.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleFindNow}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <Clock className="w-4 h-4" />
              Find Free Room Right Now
            </button>
            <Link
              to="/find-rooms"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <Search className="w-4 h-4 text-slate-400" />
              Custom Search
            </Link>
          </div>
        </div>
      </div>

      {/* PRP Statistics Cards */}
      <div>
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          PRP Block Infrastructure
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Total Rooms</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">
                {dashboard?.total_rooms || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across 7 Floors</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Classrooms</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">
                {dashboard?.classroom_count || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">50-minute slots</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Computer Labs</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">
                {dashboard?.lab_count || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Specialized labs</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Total Floors</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">
                {dashboard?.total_floors || 7}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Floors 1 through 7</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          to="/find-rooms"
          className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-blue-500/30 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
              Find Available Rooms
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Filter by Day of the week, Slot number, Floor (1-7), and Room Type (Classroom or Lab)
              to identify unoccupied rooms instantly.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
            <span>Open Availability Finder</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/rooms"
          className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-indigo-500/30 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
              PRP Room Directory & Timetables
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Explore all registered rooms in PRP Block, check seating capacities, and view the
              entire weekly timetable grid for any room.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
            <span>Browse Directory</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
};
