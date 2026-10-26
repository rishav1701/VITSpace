import React, { useEffect, useState } from 'react';
import type { Room, Schedule } from '../types';
import { scheduleApi } from '../services/api';
import { DAYS, DAY_LABELS, SLOT_TIMES } from '../types';
import { X, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react';

interface RoomScheduleModalProps {
  room: Room | null;
  onClose: () => void;
}

export const RoomScheduleModal: React.FC<RoomScheduleModalProps> = ({ room, onClose }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) return;
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await scheduleApi.list({ room_id: room.room_id });
        setSchedules(res.data.schedules);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load room schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [room]);

  if (!room) return null;

  // Build grid map: key = `${day}_${slot}`
  const scheduleMap = new Map<string, Schedule>();
  schedules.forEach((s) => {
    scheduleMap.set(`${s.day_of_week}_${s.slot_number}`, s);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{room.room_number}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Floor {room.floor}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {room.room_type}
                </span>
              </div>
              <p className="text-xs text-slate-400">Weekly Schedule & Occupancy Matrix</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm">Fetching timetable from Oracle database...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
                  <span>Available / Free</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500/20 border border-rose-500/40" />
                  <span>Occupied / Scheduled</span>
                </div>
              </div>

              {/* Responsive Timetable Table */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-300 font-semibold">
                      <th className="p-3 whitespace-nowrap min-w-[90px]">Day</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
                        const info = SLOT_TIMES[slot];
                        return (
                          <th key={slot} className="p-3 text-center border-l border-slate-800 min-w-[95px]">
                            <div className="font-bold">Slot {slot}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {info?.start}-{info?.end}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {DAYS.map((day) => (
                      <tr key={day} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-3 font-semibold text-slate-200 bg-slate-950/30">
                          {DAY_LABELS[day]}
                        </td>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
                          const sched = scheduleMap.get(`${day}_${slot}`);
                          return (
                            <td
                              key={slot}
                              className={`p-2.5 text-center border-l border-slate-800 transition-colors ${
                                sched
                                  ? 'bg-rose-500/10 text-rose-300 font-medium'
                                  : 'bg-emerald-500/5 text-emerald-400/80 hover:bg-emerald-500/10'
                              }`}
                            >
                              {sched ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-[11px] font-bold text-rose-400">Class</span>
                                  <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    {sched.start_time}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-emerald-400 font-medium">Free</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close Timetable
          </button>
        </div>
      </div>
    </div>
  );
};
