import React, { useEffect, useState } from 'react';
import type { Room, Schedule, Day } from '../types';
import { scheduleApi } from '../services/api';
import { DAYS, DAY_LABELS, SLOT_TIMES } from '../types';
import { useToastContext } from '../context/ToastContext';
import { X, Calendar, Clock, Loader2, AlertCircle, Plus, Trash2, CheckCircle, Sparkles } from 'lucide-react';

interface RoomScheduleModalProps {
  room: Room | null;
  onClose: () => void;
  onScheduleUpdated?: () => void;
}

export const RoomScheduleModal: React.FC<RoomScheduleModalProps> = ({ room, onClose, onScheduleUpdated }) => {
  const { showToast } = useToastContext();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected cell for modification
  const [selectedCell, setSelectedCell] = useState<{
    day: Day;
    slot: number;
    schedule: Schedule | null;
  } | null>(null);

  const [savingAction, setSavingAction] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');

  const fetchSchedule = async (silent = false) => {
    if (!room) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await scheduleApi.list({ room_id: room.room_id });
      setSchedules(res.data.schedules);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load room schedule');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!room) return;
    fetchSchedule();
  }, [room]);

  if (!room) return null;

  // Build grid map: key = `${day}_${slot}`
  const scheduleMap = new Map<string, Schedule>();
  schedules.forEach((s) => {
    scheduleMap.set(`${s.day_of_week}_${s.slot_number}`, s);
  });

  const handleCellClick = (day: Day, slot: number, sched?: Schedule) => {
    const slotInfo = SLOT_TIMES[slot] || { start: '08:00', end: '08:50' };
    setSelectedCell({
      day,
      slot,
      schedule: sched || null,
    });
    setCustomStartTime(sched ? sched.start_time : slotInfo.start);
    setCustomEndTime(sched ? sched.end_time : slotInfo.end);
  };

  const handleAssignSlot = async () => {
    if (!selectedCell || !room) return;
    setSavingAction(true);
    try {
      await scheduleApi.create({
        room_id: room.room_id,
        day_of_week: selectedCell.day,
        slot_number: selectedCell.slot,
        start_time: customStartTime.trim(),
        end_time: customEndTime.trim(),
      });
      showToast(`Slot ${selectedCell.slot} on ${DAY_LABELS[selectedCell.day]} assigned!`, 'success');
      setSelectedCell(null);
      await fetchSchedule(true);
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to assign slot', 'error');
    } finally {
      setSavingAction(false);
    }
  };

  const handleFreeSlot = async () => {
    if (!selectedCell || !selectedCell.schedule) return;
    setSavingAction(true);
    try {
      await scheduleApi.delete(selectedCell.schedule.schedule_id);
      showToast(`Slot ${selectedCell.slot} on ${DAY_LABELS[selectedCell.day]} freed!`, 'success');
      setSelectedCell(null);
      await fetchSchedule(true);
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to free slot', 'error');
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
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
              <p className="text-xs text-slate-400">Interactive Weekly Schedule & Occupancy Matrix</p>
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
              <p className="text-sm">Loading timetable...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Instructions banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    <strong>Interactive Table:</strong> Click on any slot below to directly <strong>modify, assign, or free</strong> that period!
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
                    <span>Free</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-rose-500/20 border border-rose-500/40" />
                    <span>Occupied</span>
                  </div>
                </div>
              </div>

              {/* Responsive Timetable Table */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300 font-semibold">
                      <th className="p-3.5 whitespace-nowrap min-w-[95px] bg-slate-950">Day</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
                        const info = SLOT_TIMES[slot];
                        return (
                          <th key={slot} className="p-3 text-center border-l border-slate-800 min-w-[105px]">
                            <div className="font-bold text-slate-200">Slot {slot}</div>
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
                      <tr key={day} className="hover:bg-slate-800/10 transition-colors">
                        <td className="p-3 font-semibold text-slate-200 bg-slate-950/50 whitespace-nowrap">
                          {DAY_LABELS[day]}
                        </td>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
                          const sched = scheduleMap.get(`${day}_${slot}`);
                          const isSelected = selectedCell?.day === day && selectedCell?.slot === slot;
                          return (
                            <td
                              key={slot}
                              onClick={() => handleCellClick(day, slot, sched)}
                              className={`p-2.5 text-center border-l border-slate-800 cursor-pointer select-none transition-all group relative ${
                                isSelected
                                  ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/20'
                                  : sched
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300'
                                  : 'bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400'
                              }`}
                              title={sched ? 'Click to modify or free this slot' : 'Click to book or assign this slot'}
                            >
                              {sched ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                                    Class
                                  </span>
                                  <span className="text-[9px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    {sched.start_time}
                                  </span>
                                  <span className="text-[8px] text-rose-400/70 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                                    Click to modify
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] text-emerald-400 font-medium">Free</span>
                                  <span className="text-[8px] text-emerald-400/70 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex items-center gap-0.5">
                                    <Plus className="w-2 h-2" /> Assign
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Slot Adjustment Panel */}
              {selectedCell && (
                <div className="p-4 rounded-xl border border-blue-500/30 bg-slate-950/90 shadow-xl animate-in slide-in-from-top-2 duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Adjusting: {DAY_LABELS[selectedCell.day]} — Slot {selectedCell.slot}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            selectedCell.schedule
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {selectedCell.schedule ? 'Currently Occupied' : 'Currently Free'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Room {room.room_number} (Floor {room.floor})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <label className="text-slate-400">Time:</label>
                        <input
                          type="text"
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                          placeholder="08:00"
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center focus:outline-none focus:border-blue-500"
                        />
                        <span>–</span>
                        <input
                          type="text"
                          value={customEndTime}
                          onChange={(e) => setCustomEndTime(e.target.value)}
                          placeholder="08:50"
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {selectedCell.schedule ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleFreeSlot}
                            disabled={savingAction}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {savingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Free this Slot
                          </button>
                          <button
                            onClick={handleAssignSlot}
                            disabled={savingAction}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Update Time
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleAssignSlot}
                          disabled={savingAction}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-colors disabled:opacity-50"
                        >
                          {savingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Assign Slot Now
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedCell(null)}
                        className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {schedules.length} slot(s) scheduled in room {room.room_number}
          </span>
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
