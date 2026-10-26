import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import type { AdminDashboard, FloorSummary } from '../types';
import {
  Building2,
  CalendarDays,
  Users,
  Layers,
  BookOpen,
  Laptop,
  Plus,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [floors, setFloors] = useState<FloorSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, floorRes] = await Promise.all([
          dashboardApi.admin(),
          dashboardApi.floors(),
        ]);
        setStats(dashRes.data);
        setFloors(floorRes.data);
      } catch (err) {
        console.error('Error fetching admin dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PRP Block Administration</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Admin Management Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time control over PRP classrooms, weekly timetable slots, and student accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/rooms"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Room
          </Link>
          <Link
            to="/admin/schedules"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
          >
            <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
            Manage Slots
          </Link>
        </div>
      </div>

      {/* Main Metric Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium mb-1">Total Rooms</div>
            <div className="text-2xl font-black text-white">{stats?.total_rooms || 0}</div>
            <div className="text-[10px] text-slate-400 mt-1">PRP Block</div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium mb-1">Classrooms</div>
            <div className="text-2xl font-black text-emerald-400">{stats?.classroom_count || 0}</div>
            <div className="text-[10px] text-slate-400 mt-1">Lecture halls</div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium mb-1">Computer Labs</div>
            <div className="text-2xl font-black text-purple-400">{stats?.lab_count || 0}</div>
            <div className="text-[10px] text-slate-400 mt-1">Specialized labs</div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium mb-1">Active Schedules</div>
            <div className="text-2xl font-black text-amber-400">{stats?.total_schedules || 0}</div>
            <div className="text-[10px] text-slate-400 mt-1">Slot allocations</div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium mb-1">Total Students</div>
            <div className="text-2xl font-black text-blue-400">{stats?.total_students || 0}</div>
            <div className="text-[10px] text-slate-400 mt-1">Registered users</div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <div className="text-slate-400 text-xs font-medium mb-1">PRP Floors</div>
            <div className="text-2xl font-black text-cyan-400">{stats?.total_floors || 7}</div>
            <div className="text-[10px] text-slate-400 mt-1">Level 1 to 7</div>
          </div>
        </div>
      )}

      {/* Floor by floor distribution */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Floor-by-Floor Breakdown
          </h2>
          <span className="text-xs text-slate-400">Aggregated from Oracle DB</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {floors.map((fl) => (
            <div key={fl.floor} className="glass-card rounded-2xl p-4 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <span className="text-sm font-bold text-white">Floor {fl.floor}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  {fl.total_rooms} {fl.total_rooms === 1 ? 'room' : 'rooms'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    Classrooms:
                  </span>
                  <span className="font-semibold">{fl.classroom_count}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Laptop className="w-3.5 h-3.5 text-purple-400" />
                    Labs:
                  </span>
                  <span className="font-semibold">{fl.lab_count}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    Total Capacity:
                  </span>
                  <span className="font-bold text-slate-200">{fl.total_capacity} seats</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/rooms"
          className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-blue-500/30 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              Manage PRP Rooms
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add new rooms, update seating capacities, edit room types, or remove rooms.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-400">
            <span>Room Management</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/admin/schedules"
          className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-amber-500/30 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              Manage Room Schedules
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Create slot assignments, modify times, and resolve timetable clashes.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-400">
            <span>Schedule Management</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/admin/students"
          className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-purple-500/30 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
              Student Records
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Browse registered student profiles, departments, and linked auth accounts.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-400">
            <span>Student Directory</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
};
