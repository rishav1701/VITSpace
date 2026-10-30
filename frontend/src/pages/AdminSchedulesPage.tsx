import React, { useState, useEffect } from 'react';
import { scheduleApi, roomApi } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import type { Schedule, Room, Day } from '../types';
import { DAYS, DAY_LABELS, SLOT_TIMES } from '../types';
import { useToastContext } from '../context/ToastContext';
import { RoomScheduleModal } from '../components/RoomScheduleModal';
import {
  CalendarDays,
  Plus,
  Trash2,
  X,
  Loader2,
  Clock,
  Building,
  AlertTriangle,
  Pencil,
  Calendar,
} from 'lucide-react';

export const AdminSchedulesPage: React.FC = () => {
  const { showToast } = useToastContext();

  const [schedules, setSchedules] = useState<Schedule[]>(() => offlineStorage.getSchedules());
  const [rooms, setRooms] = useState<Room[]>(() => offlineStorage.getRooms());
  const [loading, setLoading] = useState(false);
  const [timetableModalRoom, setTimetableModalRoom] = useState<Room | null>(null);

  // Filters
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterRoomId, setFilterRoomId] = useState<number | ''>('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);

  // Form State
  const [formRoomId, setFormRoomId] = useState<number | ''>('');
  const [formDay, setFormDay] = useState<Day>('MON');
  const [formSlot, setFormSlot] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState<string>('08:00');
  const [formEndTime, setFormEndTime] = useState<string>('08:50');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filterDay) params.day_of_week = filterDay;
      if (filterRoomId !== '') params.room_id = Number(filterRoomId);

      const [schedRes, roomRes] = await Promise.all([
        scheduleApi.list(params),
        roomApi.list(),
      ]);
      setSchedules(schedRes.data.schedules);
      setRooms(roomRes.data.rooms);
    } catch (err) {
      console.error('Error fetching schedules', err);
      showToast('Failed to load schedules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDay, filterRoomId]);

  // When slot changes in form, auto-fill standard start & end time
  const handleSlotChange = (newSlot: number) => {
    setFormSlot(newSlot);
    const standard = SLOT_TIMES[newSlot];
    if (standard) {
      setFormStartTime(standard.start);
      setFormEndTime(standard.end);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSchedule(null);
    setFormRoomId(rooms.length > 0 ? rooms[0].room_id : '');
    setFormDay('MON');
    setFormSlot(1);
    setFormStartTime(SLOT_TIMES[1]?.start || '08:00');
    setFormEndTime(SLOT_TIMES[1]?.end || '08:50');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (sched: Schedule) => {
    setEditingSchedule(sched);
    setFormRoomId(sched.room_id);
    setFormDay(sched.day_of_week as Day);
    setFormSlot(sched.slot_number);
    setFormStartTime(sched.start_time);
    setFormEndTime(sched.end_time);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (sched: Schedule) => {
    setDeletingSchedule(sched);
    setDeleteModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formRoomId) {
      setFormError('Please select a room');
      return;
    }
    if (!formStartTime.trim() || !formEndTime.trim()) {
      setFormError('Start and end times are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSchedule) {
        await scheduleApi.update(editingSchedule.schedule_id, {
          room_id: Number(formRoomId),
          day_of_week: formDay,
          slot_number: formSlot,
          start_time: formStartTime.trim(),
          end_time: formEndTime.trim(),
        });
        showToast('Schedule slot updated successfully', 'success');
      } else {
        await scheduleApi.create({
          room_id: Number(formRoomId),
          day_of_week: formDay,
          slot_number: formSlot,
          start_time: formStartTime.trim(),
          end_time: formEndTime.trim(),
        });
        showToast('New schedule slot assigned successfully', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchedule) return;
    setSubmitting(true);
    try {
      await scheduleApi.delete(deletingSchedule.schedule_id);
      showToast('Schedule entry removed successfully', 'success');
      setDeleteModalOpen(false);
      setDeletingSchedule(null);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete schedule', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-amber-500" />
            PRP Schedule Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Assign timetable slots to classrooms and labs across MON-SAT with clash prevention.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (rooms.length > 0) {
                const targetRoom = filterRoomId
                  ? rooms.find((r) => r.room_id === Number(filterRoomId)) || rooms[0]
                  : rooms[0];
                setTimetableModalRoom(targetRoom);
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all self-start sm:self-auto"
            title="Open Interactive Weekly Matrix"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            Interactive Timetable
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Assign New Slot
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All Days (MON - SAT)</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400" />
            <select
              value={filterRoomId}
              onChange={(e) => setFilterRoomId(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 max-w-[200px]"
            >
              <option value="">All Rooms</option>
              {rooms.map((r) => (
                <option key={r.room_id} value={r.room_id}>
                  {r.room_number} (Floor {r.floor})
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400">
          Showing <span className="text-white font-semibold">{schedules.length}</span> schedule entries
        </span>
      </div>

      {/* Table of Schedules */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs">Loading schedule records from Oracle DB...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-slate-800">
          <CalendarDays className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No schedules found</h3>
          <p className="text-xs text-slate-400 mt-1">Assign a new slot or adjust filters.</p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-2xl overflow-hidden glass-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Room</th>
                  <th className="p-3.5">Floor</th>
                  <th className="p-3.5">Day</th>
                  <th className="p-3.5">Slot Number</th>
                  <th className="p-3.5">Time Interval</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {schedules.map((s) => (
                  <tr key={s.schedule_id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {s.room_number || `Room #${s.room_id}`}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {s.floor !== undefined ? `Floor ${s.floor}` : '—'}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                        {DAY_LABELS[s.day_of_week as Day] || s.day_of_week}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-amber-400">Slot {s.slot_number}</td>
                    <td className="p-3.5 text-slate-300">
                      {s.start_time} – {s.end_time}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Edit Slot"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Schedule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <h3 className="text-base font-bold text-white">
                {editingSchedule ? 'Edit Schedule Slot' : 'Assign New Schedule Slot'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PRP Room *
                </label>
                <select
                  value={formRoomId}
                  onChange={(e) => setFormRoomId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {rooms.map((r) => (
                    <option key={r.room_id} value={r.room_id}>
                      {r.room_number} — Floor {r.floor} ({r.room_type}, {r.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Day of Week *
                  </label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as Day)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {DAY_LABELS[d]} ({d})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Slot Number (1-8) *
                  </label>
                  <select
                    value={formSlot}
                    onChange={(e) => handleSlotChange(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Slot {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="HH:MM e.g. 08:00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    End Time *
                  </label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="HH:MM e.g. 08:50"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingSchedule ? 'Update Slot' : 'Assign Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Delete Schedule Entry?</h3>
              <p className="text-xs text-slate-400 mt-2">
                This will free up Slot {deletingSchedule.slot_number} on {deletingSchedule.day_of_week} for{' '}
                {deletingSchedule.room_number || `Room #${deletingSchedule.room_id}`}.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Timetable Modal */}
      <RoomScheduleModal
        room={timetableModalRoom}
        onClose={() => setTimetableModalRoom(null)}
        onScheduleUpdated={fetchData}
      />
    </div>
  );
};
