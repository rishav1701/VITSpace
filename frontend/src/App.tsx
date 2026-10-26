import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { FindRoomsPage } from './pages/FindRoomsPage';
import { RoomDirectoryPage } from './pages/RoomDirectoryPage';
import { AdminRoomsPage } from './pages/AdminRoomsPage';
import { AdminSchedulesPage } from './pages/AdminSchedulesPage';
import { AdminStudentsPage } from './pages/AdminStudentsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
        <p className="text-sm font-medium">Entering VITSpace PRP System...</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected authenticated routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RootRedirect />} />
              <Route path="dashboard" element={<StudentDashboardPage />} />
              <Route path="find-rooms" element={<FindRoomsPage />} />
              <Route path="rooms" element={<RoomDirectoryPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Admin-only routes */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/rooms"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminRoomsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/schedules"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSchedulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/students"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminStudentsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
