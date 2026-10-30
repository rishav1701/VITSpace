// VITSpace — Offline Storage & Instant Local Cache Service
import type { Room, Schedule, Student, AdminDashboard, StudentDashboard, FloorSummary, AvailableRoom } from '../types';
import defaultData from './defaultSeedData.json';

const ROOMS_KEY = 'vitspace_cached_rooms';
const SCHEDULES_KEY = 'vitspace_cached_schedules';
const STUDENTS_KEY = 'vitspace_cached_students';
const ADMIN_DASH_KEY = 'vitspace_cached_admin_dash';
const STUDENT_DASH_KEY = 'vitspace_cached_student_dash';

// Safe localStorage access
const getItem = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to save to localStorage (${key}):`, err);
  }
};

// Seed initial offline storage if empty
export const initializeOfflineCache = () => {
  if (typeof window === 'undefined') return;
  const existingRooms = localStorage.getItem(ROOMS_KEY);
  if (!existingRooms || existingRooms === '[]') {
    setItem(ROOMS_KEY, defaultData.rooms as Room[]);
  }
  const existingScheds = localStorage.getItem(SCHEDULES_KEY);
  if (!existingScheds || existingScheds === '[]') {
    setItem(SCHEDULES_KEY, defaultData.schedules as Schedule[]);
  }
  const existingStudents = localStorage.getItem(STUDENTS_KEY);
  if (!existingStudents || existingStudents === '[]') {
    setItem(STUDENTS_KEY, [
      {
        reg_no: '21BCE0001',
        name: 'Rishav Raj',
        mail: 'rishav.raj2021@vitstudent.ac.in',
        dept: 'CSE',
      },
    ]);
  }
};

// Run seed immediately
initializeOfflineCache();

export const offlineStorage = {
  // Rooms
  getRooms: (): Room[] => {
    const rooms = getItem<Room[]>(ROOMS_KEY, defaultData.rooms as Room[]);
    return rooms.length > 0 ? rooms : (defaultData.rooms as Room[]);
  },
  setRooms: (rooms: Room[]): void => {
    setItem(ROOMS_KEY, rooms);
  },
  saveRoom: (room: Room): void => {
    const rooms = offlineStorage.getRooms();
    const index = rooms.findIndex((r) => r.room_id === room.room_id);
    if (index >= 0) {
      rooms[index] = room;
    } else {
      rooms.push(room);
    }
    offlineStorage.setRooms(rooms);
  },
  deleteRoom: (roomId: number): void => {
    const rooms = offlineStorage.getRooms().filter((r) => r.room_id !== roomId);
    offlineStorage.setRooms(rooms);
  },

  // Schedules
  getSchedules: (roomId?: number): Schedule[] => {
    const scheds = getItem<Schedule[]>(SCHEDULES_KEY, defaultData.schedules as Schedule[]);
    if (roomId !== undefined) {
      return scheds.filter((s) => s.room_id === roomId);
    }
    return scheds;
  },
  setSchedules: (schedules: Schedule[]): void => {
    setItem(SCHEDULES_KEY, schedules);
  },
  saveSchedule: (schedule: Schedule): void => {
    const scheds = offlineStorage.getSchedules();
    const index = scheds.findIndex((s) => s.schedule_id === schedule.schedule_id);
    if (index >= 0) {
      scheds[index] = schedule;
    } else {
      scheds.push(schedule);
    }
    offlineStorage.setSchedules(scheds);
  },
  deleteSchedule: (scheduleId: number): void => {
    const scheds = offlineStorage.getSchedules().filter((s) => s.schedule_id !== scheduleId);
    offlineStorage.setSchedules(scheds);
  },

  // Students
  getStudents: (): Student[] => {
    return getItem<Student[]>(STUDENTS_KEY, [
      {
        reg_no: '21BCE0001',
        name: 'Rishav Raj',
        mail: 'rishav.raj2021@vitstudent.ac.in',
        dept: 'CSE',
      },
    ]);
  },
  setStudents: (students: Student[]): void => {
    setItem(STUDENTS_KEY, students);
  },

  // Dashboards
  getAdminDashboard: (): AdminDashboard => {
    const rooms = offlineStorage.getRooms();
    const scheds = offlineStorage.getSchedules();
    const students = offlineStorage.getStudents();

    const floorMap = new Map<number, { classrooms: number; labs: number; total: number; capacity: number }>();
    for (let f = 1; f <= 7; f++) {
      floorMap.set(f, { classrooms: 0, labs: 0, total: 0, capacity: 0 });
    }
    rooms.forEach((r) => {
      const curr = floorMap.get(r.floor) || { classrooms: 0, labs: 0, total: 0, capacity: 0 };
      if (r.room_type === 'Classroom') curr.classrooms += 1;
      else curr.labs += 1;
      curr.total += 1;
      curr.capacity += r.capacity;
      floorMap.set(r.floor, curr);
    });

    const floors: FloorSummary[] = Array.from(floorMap.entries())
      .filter(([_, data]) => data.total > 0)
      .map(([floor, data]) => ({
        floor,
        classroom_count: data.classrooms,
        lab_count: data.labs,
        total_rooms: data.total,
        total_capacity: data.capacity,
      }));

    const fallback: AdminDashboard = {
      total_rooms: rooms.length,
      classroom_count: rooms.filter((r) => r.room_type === 'Classroom').length,
      lab_count: rooms.filter((r) => r.room_type === 'Lab').length,
      total_floors: floors.length,
      total_schedules: scheds.length,
      total_students: students.length,
      floors,
    };

    return getItem<AdminDashboard>(ADMIN_DASH_KEY, fallback);
  },
  setAdminDashboard: (data: AdminDashboard): void => {
    setItem(ADMIN_DASH_KEY, data);
  },

  getStudentDashboard: (name = 'Rishav Raj', dept = 'CSE'): StudentDashboard => {
    const rooms = offlineStorage.getRooms();
    const fallback: StudentDashboard = {
      student_name: name,
      student_dept: dept,
      total_rooms: rooms.length,
      classroom_count: rooms.filter((r) => r.room_type === 'Classroom').length,
      lab_count: rooms.filter((r) => r.room_type === 'Lab').length,
      total_floors: 6,
    };
    return getItem<StudentDashboard>(STUDENT_DASH_KEY, fallback);
  },
  setStudentDashboard: (data: StudentDashboard): void => {
    setItem(STUDENT_DASH_KEY, data);
  },

  // Calculate local availability
  calculateAvailability: (params: Record<string, unknown>): AvailableRoom[] => {
    const rooms = offlineStorage.getRooms();
    const scheds = offlineStorage.getSchedules();

    const block = (params.block as string) || 'PRP';
    const floor = params.floor !== undefined && params.floor !== '' ? Number(params.floor) : null;
    const roomType = (params.room_type as string) || '';
    const dayOfWeek = (params.day_of_week as string) || '';
    const slotNumber = params.slot_number !== undefined && params.slot_number !== '' ? Number(params.slot_number) : null;
    const minCapacity = params.min_capacity ? Number(params.min_capacity) : 0;

    return rooms
      .filter((r) => {
        if (block && r.block !== block) return false;
        if (floor !== null && r.floor !== floor) return false;
        if (roomType && r.room_type !== roomType) return false;
        if (minCapacity && r.capacity < minCapacity) return false;
        return true;
      })
      .map((r) => {
        let is_available = true;
        if (dayOfWeek && slotNumber !== null) {
          const hasClash = scheds.some(
            (s) =>
              s.room_id === r.room_id &&
              s.day_of_week.toUpperCase().startsWith(dayOfWeek.slice(0, 3).toUpperCase()) &&
              s.slot_number === slotNumber
          );
          is_available = !hasClash;
        }
        return {
          room_id: r.room_id,
          room_number: r.room_number,
          block: r.block,
          floor: r.floor,
          room_type: r.room_type,
          capacity: r.capacity,
          is_available,
        };
      });
  },
};

