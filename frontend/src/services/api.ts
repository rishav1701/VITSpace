// VITSpace — API Service Layer with Instant Offline-First Caching
import axios from 'axios';
import type {
  User, Room, RoomListResponse, Schedule, ScheduleListResponse,
  Student, StudentListResponse, AdminDashboard, StudentDashboard,
  FloorSummary, AvailabilityResponse,
} from '../types';
import { offlineStorage } from './offlineStorage';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 4000, // Fast 4-second timeout to fall back to cache without stalling
});

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ message: string; user: User }>('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: async () => {
    try {
      return await api.get<User>('/auth/me');
    } catch (err) {
      // Return cached user if offline
      const rawUser = localStorage.getItem('vitspace_current_user');
      if (rawUser) {
        return { data: JSON.parse(rawUser) };
      }
      throw err;
    }
  },
};

// Dashboard
export const dashboardApi = {
  admin: async () => {
    try {
      const res = await api.get<AdminDashboard>('/dashboard/admin');
      offlineStorage.setAdminDashboard(res.data);
      return res;
    } catch {
      return { data: offlineStorage.getAdminDashboard() };
    }
  },
  student: async () => {
    try {
      const res = await api.get<StudentDashboard>('/dashboard/student');
      offlineStorage.setStudentDashboard(res.data);
      return res;
    } catch {
      return { data: offlineStorage.getStudentDashboard() };
    }
  },
  floors: async () => {
    try {
      return await api.get<FloorSummary[]>('/dashboard/floors');
    } catch {
      return { data: offlineStorage.getAdminDashboard().floors };
    }
  },
};

// Rooms
export const roomApi = {
  list: async (params?: Record<string, unknown>) => {
    try {
      const res = await api.get<RoomListResponse>('/rooms', { params });
      if (res.data?.rooms) {
        offlineStorage.setRooms(res.data.rooms);
      }
      return res;
    } catch {
      let rooms = offlineStorage.getRooms();
      if (params?.floor !== undefined && params.floor !== '') {
        rooms = rooms.filter((r) => r.floor === Number(params.floor));
      }
      if (params?.room_type) {
        rooms = rooms.filter((r) => r.room_type === params.room_type);
      }
      if (params?.search) {
        const q = String(params.search).toLowerCase();
        rooms = rooms.filter((r) => r.room_number.toLowerCase().includes(q));
      }
      return { data: { rooms, total: rooms.length } };
    }
  },
  get: async (id: number) => {
    try {
      return await api.get<Room>(`/rooms/${id}`);
    } catch {
      const r = offlineStorage.getRooms().find((x) => x.room_id === id);
      if (r) return { data: r };
      throw new Error('Room not found in offline storage');
    }
  },
  create: async (data: Partial<Room>) => {
    try {
      const res = await api.post<Room>('/rooms', data);
      offlineStorage.saveRoom(res.data);
      return res;
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.status === 400) throw err;
      // Offline fallback
      const newRoom: Room = {
        room_id: Date.now(),
        room_number: data.room_number || `PRP-${Date.now() % 1000}`,
        block: data.block || 'PRP',
        floor: data.floor || 1,
        room_type: data.room_type || 'Classroom',
        capacity: data.capacity || 60,
      };
      offlineStorage.saveRoom(newRoom);
      return { data: newRoom };
    }
  },
  update: async (id: number, data: Partial<Room>) => {
    try {
      const res = await api.put<Room>(`/rooms/${id}`, data);
      offlineStorage.saveRoom(res.data);
      return res;
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.status === 400) throw err;
      const existing = offlineStorage.getRooms().find((r) => r.room_id === id);
      if (existing) {
        const updated = { ...existing, ...data } as Room;
        offlineStorage.saveRoom(updated);
        return { data: updated };
      }
      throw err;
    }
  },
  delete: async (id: number) => {
    try {
      const res = await api.delete(`/rooms/${id}`);
      offlineStorage.deleteRoom(id);
      return res;
    } catch (err: any) {
      if (err.response?.status === 400) throw err;
      offlineStorage.deleteRoom(id);
      return { data: { message: 'Deleted from offline cache' } };
    }
  },
};

// Schedules
export const scheduleApi = {
  list: async (params?: Record<string, unknown>) => {
    try {
      const res = await api.get<ScheduleListResponse>('/schedules', { params });
      if (res.data?.schedules) {
        if (!params || Object.keys(params).length === 0) {
          offlineStorage.setSchedules(res.data.schedules);
        }
      }
      return res;
    } catch {
      let schedules = offlineStorage.getSchedules();
      if (params?.room_id !== undefined && params.room_id !== '') {
        schedules = schedules.filter((s) => s.room_id === Number(params.room_id));
      }
      if (params?.day_of_week) {
        const dow = String(params.day_of_week).toUpperCase().slice(0, 3);
        schedules = schedules.filter((s) => s.day_of_week.toUpperCase().startsWith(dow));
      }
      if (params?.slot_number) {
        schedules = schedules.filter((s) => s.slot_number === Number(params.slot_number));
      }
      return { data: { schedules, total: schedules.length } };
    }
  },
  get: async (id: number) => {
    try {
      return await api.get<Schedule>(`/schedules/${id}`);
    } catch {
      const s = offlineStorage.getSchedules().find((x) => x.schedule_id === id);
      if (s) return { data: s };
      throw new Error('Schedule not found in offline storage');
    }
  },
  create: async (data: Partial<Schedule>) => {
    try {
      const res = await api.post<Schedule>('/schedules', data);
      offlineStorage.saveSchedule(res.data);
      return res;
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.status === 400) throw err;
      const room = offlineStorage.getRooms().find((r) => r.room_id === Number(data.room_id));
      const newSched: Schedule = {
        schedule_id: Date.now(),
        room_id: Number(data.room_id),
        day_of_week: data.day_of_week || 'MON',
        slot_number: Number(data.slot_number) || 1,
        start_time: data.start_time || '08:00',
        end_time: data.end_time || '08:50',
        room_number: room?.room_number,
        floor: room?.floor,
        room_type: room?.room_type,
      };
      offlineStorage.saveSchedule(newSched);
      return { data: newSched };
    }
  },
  update: async (id: number, data: Partial<Schedule>) => {
    try {
      const res = await api.put<Schedule>(`/schedules/${id}`, data);
      offlineStorage.saveSchedule(res.data);
      return res;
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.status === 400) throw err;
      const existing = offlineStorage.getSchedules().find((s) => s.schedule_id === id);
      if (existing) {
        const updated = { ...existing, ...data } as Schedule;
        offlineStorage.saveSchedule(updated);
        return { data: updated };
      }
      throw err;
    }
  },
  delete: async (id: number) => {
    try {
      const res = await api.delete(`/schedules/${id}`);
      offlineStorage.deleteSchedule(id);
      return res;
    } catch (err: any) {
      offlineStorage.deleteSchedule(id);
      return { data: { message: 'Deleted from offline cache' } };
    }
  },
  slots: () => api.get('/schedules/slots'),
};

// Availability
export const availabilityApi = {
  search: async (params: Record<string, unknown>) => {
    try {
      const res = await api.get<AvailabilityResponse>('/availability', { params });
      return res;
    } catch {
      const rooms = offlineStorage.calculateAvailability(params);
      return {
        data: {
          rooms,
          total: rooms.length,
          query: params,
        },
      };
    }
  },
};

// Students
export const studentApi = {
  list: async (params?: Record<string, unknown>) => {
    try {
      const res = await api.get<StudentListResponse>('/students', { params });
      if (res.data?.students) {
        offlineStorage.setStudents(res.data.students);
      }
      return res;
    } catch {
      let students = offlineStorage.getStudents();
      if (params?.dept) {
        students = students.filter((s) => s.dept === params.dept);
      }
      if (params?.search) {
        const q = String(params.search).toLowerCase();
        students = students.filter((s) => s.name.toLowerCase().includes(q) || s.reg_no.toLowerCase().includes(q));
      }
      return { data: { students, total: students.length } };
    }
  },
  get: (regNo: string) => api.get<Student>(`/students/${regNo}`),
  me: () => api.get<Student>('/students/me'),
  create: async (data: Partial<Student>) => {
    const res = await api.post<Student>('/students', data);
    return res;
  },
  update: async (regNo: string, data: Partial<Student>) => {
    const res = await api.put<Student>(`/students/${regNo}`, data);
    return res;
  },
  delete: (regNo: string) => api.delete(`/students/${regNo}`),
  departments: async () => {
    try {
      return await api.get<string[]>('/students/departments');
    } catch {
      return { data: ['CSE', 'ECE', 'MECH', 'EEE'] };
    }
  },
};

export default api;
