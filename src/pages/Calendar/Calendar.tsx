import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MemoryOrb } from '@/components/MemoryOrb';
import { NavButtons } from '@/components/NavButtons';
import { useMemoryOrbs } from '@/hooks/useMemoryOrbs';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarEntry, MemoryOrb as MemoryOrbType } from '@/types';

export const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { calendarEntries, loadOrbs } = useMemoryOrbs();
  const { checkAuth, isAuthenticated } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadOrbs();
  }, [isAuthenticated, navigate, loadOrbs]);

  const handleOrbClick = (orb: MemoryOrbType) => {
    navigate(`/calendar/detail/${orb.diaryId}`);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedMonth);
  const month = selectedMonth.getMonth();
  const year = selectedMonth.getFullYear();

  const getOrbsForDate = (day: number): MemoryOrbType[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = calendarEntries.find(e => e.date.startsWith(dateStr));
    return entry?.orbs || [];
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mobile-container pb-20 min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      {/* Header */}
      <header className="safe-area-top bg-gradient-to-r from-amber-400 to-orange-400 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() =>
              setSelectedMonth(new Date(year, month - 1, 1))
            }
            className="text-white text-xl"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold">
            {year}년 {month + 1}월
          </h2>
          <button
            onClick={() =>
              setSelectedMonth(new Date(year, month + 1, 1))
            }
            className="text-white text-xl"
          >
            →
          </button>
        </div>
      </header>

      {/* Bookshelf Style Calendar */}
      <main className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-16"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const orbs = getOrbsForDate(day);
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <motion.div
                key={day}
                className={`h-16 p-1 border-2 rounded-lg ${
                  isToday ? 'border-purple-500 bg-purple-50' : 'border-amber-200 bg-amber-50'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
              >
                <div className="text-xs font-semibold text-gray-700 mb-1">{day}</div>
                <div className="flex flex-wrap gap-1">
                  {orbs.map((orb) => (
                    <MemoryOrb
                      key={orb.id}
                      orb={orb}
                      size="sm"
                      onClick={() => handleOrbClick(orb)}
                      showGlitter={orb.isReinterpreted}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow-md">
          <h3 className="text-sm font-semibold mb-2">감정 색상</h3>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
              <span>기쁨</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-400"></div>
              <span>슬픔</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-red-400"></div>
              <span>화남</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-purple-400"></div>
              <span>외로움</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <NavButtons />
    </div>
  );
};

