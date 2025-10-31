import React from 'react';
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
import { AuthProvider } from '@/contexts/AuthContext';
import '@/styles/index.css';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - All routes are now public */}
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/write" element={<DiaryWrite />} />
        <Route path="/diary/complete/:diaryId" element={<DiaryComplete />} />
        <Route path="/diary/complete/v2/:diaryId" element={<DiaryCompleteV2 />} />
        <Route path="/reinterpret/:diaryId" element={<Reinterpret />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/calendar/detail/:diaryId" element={<CalendarDetail />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/settings" element={<Settings />} />

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

