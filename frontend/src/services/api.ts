// VITSpace — API Service Layer
import axios from 'axios';
import type {
  User, Room, RoomListResponse, Schedule, ScheduleListResponse,
  Student, StudentListResponse, AdminDashboard, StudentDashboard,
  FloorSummary, AvailabilityResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ message: string; user: User }>('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  admin: () => api.get<AdminDashboard>('/dashboard/admin'),
  student: () => api.get<StudentDashboard>('/dashboard/student'),
  floors: () => api.get<FloorSummary[]>('/dashboard/floors'),
};

// Rooms
export const roomApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<RoomListResponse>('/rooms', { params }),
  get: (id: number) => api.get<Room>(`/rooms/${id}`),
  create: (data: Partial<Room>) => api.post<Room>('/rooms', data),
  update: (id: number, data: Partial<Room>) => api.put<Room>(`/rooms/${id}`, data),
  delete: (id: number) => api.delete(`/rooms/${id}`),
};

// Schedules
export const scheduleApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<ScheduleListResponse>('/schedules', { params }),
  get: (id: number) => api.get<Schedule>(`/schedules/${id}`),
  create: (data: Partial<Schedule>) => api.post<Schedule>('/schedules', data),
  update: (id: number, data: Partial<Schedule>) =>
    api.put<Schedule>(`/schedules/${id}`, data),
  delete: (id: number) => api.delete(`/schedules/${id}`),
  slots: () => api.get('/schedules/slots'),
};

// Availability
export const availabilityApi = {
  search: (params: Record<string, unknown>) =>
    api.get<AvailabilityResponse>('/availability', { params }),
};

// Students
export const studentApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<StudentListResponse>('/students', { params }),
  get: (regNo: string) => api.get<Student>(`/students/${regNo}`),
  me: () => api.get<Student>('/students/me'),
  create: (data: Partial<Student>) => api.post<Student>('/students', data),
  update: (regNo: string, data: Partial<Student>) =>
    api.put<Student>(`/students/${regNo}`, data),
  delete: (regNo: string) => api.delete(`/students/${regNo}`),
  departments: () => api.get<string[]>('/students/departments'),
};

export default api;
