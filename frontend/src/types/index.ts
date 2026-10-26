// VITSpace — TypeScript Type Definitions

export interface User {
  user_id: number;
  username: string;
  role: 'student' | 'admin';
  reg_no: string | null;
  name: string | null;
  mail: string | null;
  dept: string | null;
}

export interface Room {
  room_id: number;
  room_number: string;
  block: string;
  floor: number;
  room_type: 'Classroom' | 'Lab';
  capacity: number;
}

export interface RoomListResponse {
  rooms: Room[];
  total: number;
}

export interface Schedule {
  schedule_id: number;
  room_id: number;
  day_of_week: string;
  slot_number: number;
  start_time: string;
  end_time: string;
  room_number?: string;
  floor?: number;
  room_type?: string;
}

export interface ScheduleListResponse {
  schedules: Schedule[];
  total: number;
}

export interface Student {
  reg_no: string;
  name: string;
  mail: string;
  dept: string;
}

export interface StudentListResponse {
  students: Student[];
  total: number;
}

export interface AdminDashboard {
  total_rooms: number;
  classroom_count: number;
  lab_count: number;
  total_floors: number;
  total_schedules: number;
  total_students: number;
  floors: FloorSummary[];
}

export interface StudentDashboard {
  student_name: string;
  student_dept: string;
  total_rooms: number;
  classroom_count: number;
  lab_count: number;
  total_floors: number;
}

export interface FloorSummary {
  floor: number;
  classroom_count: number;
  lab_count: number;
  total_rooms: number;
  total_capacity: number;
}

export interface AvailableRoom {
  room_id: number;
  room_number: string;
  block: string;
  floor: number;
  room_type: string;
  capacity: number;
  is_available: boolean;
}

export interface AvailabilityResponse {
  rooms: AvailableRoom[];
  total: number;
  query: Record<string, unknown>;
}

export interface SlotInfo {
  start: string;
  end: string;
}

export type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export const DAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const DAY_LABELS: Record<Day, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

export const SLOT_TIMES: Record<number, SlotInfo> = {
  1: { start: '08:00', end: '08:50' },
  2: { start: '09:00', end: '09:50' },
  3: { start: '10:00', end: '10:50' },
  4: { start: '11:00', end: '11:50' },
  5: { start: '12:00', end: '12:50' },
  6: { start: '14:00', end: '14:50' },
  7: { start: '15:00', end: '15:50' },
  8: { start: '16:00', end: '16:50' },
};
