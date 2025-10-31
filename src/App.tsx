import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { DiaryWrite } from '@/pages/DiaryWrite';
import { DiaryComplete, DiaryCompleteV2 } from '@/pages/DiaryComplete';
import { Reinterpret } from '@/pages/Reinterpret';
import { Calendar } from '@/pages/Calendar';
import { CalendarDetail } from '@/pages/CalendarDetail';
import { MyPage } from '@/pages/MyPage';
import { Settings } from '@/pages/Settings';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import '@/styles/index.css';

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, checkAuth, isLoading } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />

        {/* Private Routes */}
        <Route
          path="/write"
          element={
            <PrivateRoute>
              <DiaryWrite />
            </PrivateRoute>
          }
        />
        <Route
          path="/diary/complete/:diaryId"
          element={
            <PrivateRoute>
              <DiaryComplete />
            </PrivateRoute>
          }
        />
        <Route
          path="/diary/complete/v2/:diaryId"
          element={
            <PrivateRoute>
              <DiaryCompleteV2 />
            </PrivateRoute>
          }
        />
        <Route
          path="/reinterpret/:diaryId"
          element={
            <PrivateRoute>
              <Reinterpret />
            </PrivateRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <Calendar />
            </PrivateRoute>
          }
        />
        <Route
          path="/calendar/detail/:diaryId"
          element={
            <PrivateRoute>
              <CalendarDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/mypage"
          element={
            <PrivateRoute>
              <MyPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

