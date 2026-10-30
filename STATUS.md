# VITSpace — Project Status

> **Last Updated:** 2026-10-26 18:50 IST  
> **Conversation ID:** `b3f5305d-370e-4e83-abe2-a14235917917`

---

## 🎯 Project Overview

- **Project:** PRP Classroom Availability Management System
- **Location:** PRP Academic Block (Periyar Building), VIT Vellore
- **Repo:** [VITSpace](https://github.com/rishav1701/VITSpace)
- **Tech Stack:**
  - **Backend:** FastAPI, Python 3.11, Pydantic v2, JWT HttpOnly Auth, Passlib/Bcrypt, SlowAPI Rate Limiting
  - **Database:** Local SQLite (`vitspace.db`, zero setup, offline ready) with dual-mode support for Oracle Database (`python-oracledb` Thin Mode)
  - **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Lucide Icons, Axios

---

**Phase: Local Database Integration Completed — 100% Offline & Presentation Ready**

The application now supports an instant local database (SQLite `vitspace.db`) with zero external installation, plus seamless toggle to Oracle Cloud.
- `ROOM`: 13 rooms seeded across 6 floors.
- `ROOM_SCHEDULE`: 33 schedules mapped across slots and days.
- `STUDENTS`: Demo student record loaded (`21BCE0001` - Rishav Raj, CSE).
- `AUTH`: Pre-configured admin (`admin` / `admin123`) and student (`21BCE0001` / `student123`).
- End-to-end API test completed: 200 OK across all auth, rooms, schedules, and dashboard analytics endpoints.

---

## ✅ Completed Tasks

| # | Task | Date | Status | Notes |
|---|------|------|--------|-------|
| 1 | Git repo initialized | 2026-10-26 | Completed | `main` branch initialized |
| 2 | Oracle schema inspection & documentation | 2026-10-26 | Completed | Preserved existing `ROOM`, `ROOM_SCHEDULE`, `STUDENTS`; designed `AUTH` table |
| 3 | SQL DDL scripts | 2026-10-26 | Completed | `docs/schema.sql` created with triggers and sequences |
| 4 | Backend Core & Database Layer | 2026-10-26 | Completed | `app/database/connection.py` (oracledb thin mode) |
| 5 | Security & Authentication | 2026-10-26 | Completed | JWT cookies, bcrypt password hashing, role-based authorization |
| 6 | Repositories & Schemas | 2026-10-26 | Completed | Complete Oracle queries for rooms, schedules, students, availability |
| 7 | Backend API Endpoints | 2026-10-26 | Completed | `/api/auth`, `/api/rooms`, `/api/schedules`, `/api/students`, `/api/availability`, `/api/dashboard` |
| 8 | Admin Setup Script | 2026-10-26 | Completed | `backend/setup_admin.py` for AUTH initialization and seeding |
| 9 | Frontend Scaffolding & Setup | 2026-10-26 | Completed | Vite + React + TypeScript + Tailwind CSS v4 |
| 10 | Frontend Auth & Toast Providers | 2026-10-26 | Completed | `AuthProvider`, `useAuth`, `ToastProvider`, `ToastContainer` |
| 11 | Component Library | 2026-10-26 | Completed | `Navbar`, `Sidebar`, `Layout`, `RoomCard`, `RoomScheduleModal`, `ProtectedRoute` |
| 12 | Frontend Pages | 2026-10-26 | Completed | LoginPage, StudentDashboard, AdminDashboard, FindRooms, RoomDirectory, AdminRooms, AdminSchedules, AdminStudents, Profile, NotFound |
| 13 | Interactive Timetable Modal | 2026-10-26 | Completed | Weekly MON–SAT, Slots 1–8 timetable matrix |
| 14 | Production Build Verification | 2026-10-26 | Completed | `npm run build` passes with zero errors |
| 15 | Documentation & Setup Guide | 2026-10-26 | Completed | Comprehensive `README.md` created |

---

## 📂 Project Structure

```
VITSpace/
├── README.md                      # Comprehensive project guide & API documentation
├── STATUS.md                      # Project tracking & phase completion
├── docs/
│   └── schema.sql                 # Oracle DDL for AUTH table & reference schema
├── backend/
│   ├── .env.example               # Backend environment template
│   ├── requirements.txt           # Python dependencies (FastAPI, oracledb, etc.)
│   ├── setup_admin.py             # Script to initialize AUTH table and seed admin
│   └── app/
│       ├── main.py                # FastAPI entry point & CORS configuration
│       ├── core/config.py         # Application settings
│       ├── database/connection.py # Oracle thin mode connection pool
│       ├── security/auth.py       # JWT & password verification
│       ├── schemas/               # Pydantic request/response models
│       ├── repositories/          # Oracle SQL query execution
│       └── api/                   # REST API routers
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── App.tsx                # Routes & role guards
        ├── main.tsx               # React root entry
        ├── index.css              # Custom styling & Tailwind v4
        ├── types/                 # TypeScript interfaces
        ├── services/api.ts        # Axios API client
        ├── context/ToastContext.tsx
        ├── hooks/
        │   ├── useAuth.tsx        # Auth state & session management
        │   └── useToast.ts
        ├── components/
        │   ├── Navbar.tsx
        │   ├── Sidebar.tsx
        │   ├── Layout.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── RoomCard.tsx
        │   ├── RoomScheduleModal.tsx
        │   └── ToastContainer.tsx
        └── pages/
            ├── LoginPage.tsx
            ├── StudentDashboardPage.tsx
            ├── AdminDashboardPage.tsx
            ├── FindRoomsPage.tsx
            ├── RoomDirectoryPage.tsx
            ├── AdminRoomsPage.tsx
            ├── AdminSchedulesPage.tsx
            ├── AdminStudentsPage.tsx
            ├── ProfilePage.tsx
            └── NotFoundPage.tsx
```

---

## 🏃 Running the Application

### Backend
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend
```powershell
cd frontend
npm run dev
```
Web App: [http://localhost:5173](http://localhost:5173)
