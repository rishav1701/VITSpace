import React, { useState, useEffect } from 'react';
import { roomApi } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import type { Room } from '../types';
import { useToastContext } from '../context/ToastContext';
import { RoomCard } from '../components/RoomCard';
import { RoomScheduleModal } from '../components/RoomScheduleModal';
import {
  Building2,
  Plus,
  Search,
  Layers,
  Filter,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const AdminRoomsPage: React.FC = () => {
  const { showToast } = useToastContext();
  const [rooms, setRooms] = useState<Room[]>(() => offlineStorage.getRooms());
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedFloor, setSelectedFloor] = useState<number | ''>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [scheduleModalRoom, setScheduleModalRoom] = useState<Room | null>(null);

  // Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState<number>(1);
  const [roomType, setRoomType] = useState<'Classroom' | 'Lab'>('Classroom');
  const [capacity, setCapacity] = useState<number>(60);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      showToast('Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedFloor, selectedType]);

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setFloor(1);
    setRoomType('Classroom');
    setCapacity(60);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.room_number);
    setFloor(room.floor);
    setRoomType(room.room_type);
    setCapacity(room.capacity);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (room: Room) => {
    setDeletingRoom(room);
    setDeleteModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!roomNumber.trim()) {
      setFormError('Room number is required (e.g. PRP-301)');
      return;
    }
    if (floor < 1 || floor > 7) {
      setFormError('Floor must be between 1 and 7');
      return;
    }
    if (capacity <= 0) {
      setFormError('Capacity must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      if (editingRoom) {
        await roomApi.update(editingRoom.room_id, {
          room_number: roomNumber.trim().toUpperCase(),
          floor,
          room_type: roomType,
          capacity,
          block: 'PRP',
        });
        showToast(`Room ${roomNumber} updated successfully!`, 'success');
      } else {
        await roomApi.create({
          room_number: roomNumber.trim().toUpperCase(),
          floor,
          room_type: roomType,
          capacity,
          block: 'PRP',
        });
        showToast(`Room ${roomNumber} created successfully!`, 'success');
      }
      setModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to save room details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRoom) return;
    setSubmitting(true);
    try {
      await roomApi.delete(deletingRoom.room_id);
      showToast(`Room ${deletingRoom.room_number} deleted successfully`, 'success');
      setDeleteModalOpen(false);
      setDeletingRoom(null);
      fetchRooms();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete room', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
      {/* Header with Add Room Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-500" />
            PRP Room Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Add new lecture halls and labs, modify capacity, or manage room metadata with Oracle integrity checks.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Room
        </button>
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

      {/* Rooms Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs">Loading rooms from Oracle database...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-slate-800">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No rooms found</h3>
          <p className="text-xs text-slate-400 mt-1">Add a new room or change filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.room_id}
              room={room}
              showAdminActions
              onViewSchedule={(r) => setScheduleModalRoom(r)}
              onEdit={(r) => handleOpenEditModal(r)}
              onDelete={(r) => handleOpenDeleteModal(r)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Room Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <h3 className="text-base font-bold text-white">
                {editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New PRP Room'}
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
                  Room Number *
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. PRP-301 or PRP-LAB-1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Floor (1 - 7) *
                  </label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((f) => (
                      <option key={f} value={f}>
                        Floor {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Room Type *
                  </label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as 'Classroom' | 'Lab')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Lab">Computer Lab</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Seating Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deletingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Delete Room {deletingRoom.room_number}?</h3>
              <p className="text-xs text-slate-400 mt-2">
                This will remove the room and any associated schedule entries from the Oracle database.
                This action cannot be undone.
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

      {/* Room Schedule Modal */}
      <RoomScheduleModal
        room={scheduleModalRoom}
        onClose={() => setScheduleModalRoom(null)}
        onScheduleUpdated={fetchRooms}
      />
    </div>
  );
};
