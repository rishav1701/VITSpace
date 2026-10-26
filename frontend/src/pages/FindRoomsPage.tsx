import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { availabilityApi } from '../services/api';
import type { AvailableRoom, Room, Day } from '../types';
import { DAYS, DAY_LABELS, SLOT_TIMES } from '../types';
import { RoomCard } from '../components/RoomCard';
import { RoomScheduleModal } from '../components/RoomScheduleModal';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export const FindRoomsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial query from URL params or defaults
  const initialDay = (searchParams.get('day') as Day) || 'MON';
  const initialSlot = searchParams.get('slot') ? Number(searchParams.get('slot')) : 1;
  const initialFloor = searchParams.get('floor') ? Number(searchParams.get('floor')) : '';
  const initialType = searchParams.get('type') || '';

  const [day, setDay] = useState<Day>(DAYS.includes(initialDay) ? initialDay : 'MON');
  const [slot, setSlot] = useState<number>(initialSlot);
  const [floor, setFloor] = useState<number | ''>(initialFloor ? Number(initialFloor) : '');
  const [roomType, setRoomType] = useState<string>(initialType);

  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'available' | 'occupied'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Schedule modal state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        day_of_week: day,
        slot_number: slot,
      };
      if (floor !== '') params.floor = Number(floor);
      if (roomType) params.room_type = roomType;

      const res = await availabilityApi.search(params);
      setRooms(res.data.rooms);
      setHasSearched(true);

      // Update URL query params smoothly
      const newParams = new URLSearchParams();
      newParams.set('day', day);
      newParams.set('slot', slot.toString());
      if (floor !== '') newParams.set('floor', floor.toString());
      if (roomType) newParams.set('type', roomType);
      setSearchParams(newParams, { replace: true });
    } catch (err) {
      console.error('Error checking availability', err);
    } finally {
      setLoading(false);
    }
  }, [day, slot, floor, roomType, setSearchParams]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Client-side filtering
  const filteredRooms = rooms.filter((r) => {
    if (filterTab === 'available' && !r.is_available) return false;
    if (filterTab === 'occupied' && r.is_available) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.room_number.toLowerCase().includes(q) ||
        `floor ${r.floor}`.includes(q) ||
        r.room_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableCount = rooms.filter((r) => r.is_available).length;
  const occupiedCount = rooms.filter((r) => !r.is_available).length;
  const currentSlotTime = SLOT_TIMES[slot];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Search className="w-6 h-6 text-blue-500" />
          Find Available Classrooms & Labs
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Select Day, Slot, and filters to evaluate room availability computed dynamically in
          Oracle SQL.
        </p>
      </div>

      {/* Filter Control Box */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Day Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Day of Week
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as Day)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d]} ({d})
                </option>
              ))}
            </select>
          </div>

          {/* Slot Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Time Slot
            </label>
            <select
              value={slot}
              onChange={(e) => setSlot(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Slot {s} ({SLOT_TIMES[s]?.start} - {SLOT_TIMES[s]?.end})
                </option>
              ))}
            </select>
          </div>

          {/* Floor Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              Floor (PRP 1-7)
            </label>
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Floors (1 to 7)</option>
              {[1, 2, 3, 4, 5, 6, 7].map((f) => (
                <option key={f} value={f}>
                  Floor {f}
                </option>
              ))}
            </select>
          </div>

          {/* Room Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="Classroom">Classroom</option>
              <option value="Lab">Computer Lab</option>
            </select>
          </div>
        </div>

        {/* Action button row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Querying:</span>
            <span className="font-semibold text-blue-400">
              {DAY_LABELS[day]} • Slot {slot} ({currentSlotTime?.start} - {currentSlotTime?.end})
            </span>
          </div>

          <button
            onClick={() => fetchAvailability()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Refresh Availability
          </button>
        </div>
      </div>

      {/* Results Header with Status Tabs and Search */}
      {hasSearched && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Tabs: All / Available / Occupied */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({rooms.length})
            </button>
            <button
              onClick={() => setFilterTab('available')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'available'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Available ({availableCount})
            </button>
            <button
              onClick={() => setFilterTab('occupied')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'occupied'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              Occupied ({occupiedCount})
            </button>
          </div>

          {/* Search bar inside results */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room e.g. PRP-301..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Grid of Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs">Evaluating PRP schedule conflicts via Oracle Database...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-slate-800">
          <Building className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No rooms match your criteria</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try switching filter tabs, changing the floor selection, or choosing a different time slot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.room_id}
              room={room}
              isAvailable={room.is_available}
              onViewSchedule={(r) => setSelectedRoom(r)}
            />
          ))}
        </div>
      )}

      {/* Room Schedule Modal */}
      <RoomScheduleModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />
    </div>
  );
};
