import React, { useState, useEffect } from 'react';
import { roomApi } from '../services/api';
import type { Room } from '../types';
import { RoomCard } from '../components/RoomCard';
import { RoomScheduleModal } from '../components/RoomScheduleModal';
import { Building2, Search, Filter, Layers, Loader2 } from 'lucide-react';

export const RoomDirectoryPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<number | ''>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (selectedFloor !== '') params.floor = Number(selectedFloor);
      if (selectedType) params.room_type = selectedType;

      const res = await roomApi.list(params);
      setRooms(res.data.rooms);
    } catch (err) {
      console.error('Error fetching rooms', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedFloor, selectedType]);

  const filteredRooms = rooms.filter((r) => {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-blue-500" />
          PRP Block Room Directory
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore all classrooms and specialized laboratories across 7 floors of the PRP Academic Block.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Floor filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Floors</option>
              {[1, 2, 3, 4, 5, 6, 7].map((f) => (
                <option key={f} value={f}>
                  Floor {f}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Room Types</option>
              <option value="Classroom">Classroom</option>
              <option value="Lab">Computer Lab</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room number..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs">Loading rooms from Oracle database...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-slate-800">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No rooms found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.room_id}
              room={room}
              onViewSchedule={(r) => setSelectedRoom(r)}
            />
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <RoomScheduleModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />
    </div>
  );
};
