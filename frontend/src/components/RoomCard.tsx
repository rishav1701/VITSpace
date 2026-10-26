import React from 'react';
import type { Room, AvailableRoom } from '../types';
import { Building, Users, Layers, Calendar, CheckCircle2, XCircle, Pencil, Trash2 } from 'lucide-react';

interface RoomCardProps {
  room: Room | AvailableRoom;
  isAvailable?: boolean;
  onViewSchedule?: (room: Room) => void;
  onEdit?: (room: Room) => void;
  onDelete?: (room: Room) => void;
  showAdminActions?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isAvailable,
  onViewSchedule,
  onEdit,
  onDelete,
  showAdminActions = false,
}) => {
  const isAvailableStatus = 'is_available' in room ? room.is_available : isAvailable;

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
      {/* Top accent gradient bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isAvailableStatus === true
            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
            : isAvailableStatus === false
            ? 'bg-gradient-to-r from-rose-500 to-amber-500'
            : room.room_type === 'Lab'
            ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
            : 'bg-gradient-to-r from-blue-500 to-cyan-400'
        }`}
      />

      <div>
        {/* Header: Room Number & Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                {room.room_number}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {room.block}
              </span>
            </div>
            <span className="text-xs text-slate-400">PRP Academic Block</span>
          </div>

          {/* Availability pill if status is known */}
          {isAvailableStatus !== undefined && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isAvailableStatus
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isAvailableStatus ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Available
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Occupied
                </>
              )}
            </span>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 my-4">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Floor</span>
              <span className="text-xs font-semibold text-slate-200">Floor {room.floor}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Capacity</span>
              <span className="text-xs font-semibold text-slate-200">{room.capacity} seats</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span
            className={`text-xs px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 ${
              room.room_type === 'Lab'
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
            }`}
          >
            <Building className="w-3 h-3" />
            {room.room_type}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {onViewSchedule && (
          <button
            onClick={() => onViewSchedule(room as Room)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 hover:text-white border border-slate-700/60 transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            Timetable
          </button>
        )}

        {showAdminActions && (
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                onClick={() => onEdit(room as Room)}
                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl border border-transparent hover:border-blue-500/20 transition-all"
                title="Edit Room"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(room as Room)}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all"
                title="Delete Room"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
