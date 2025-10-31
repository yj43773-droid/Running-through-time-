import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MemoryOrb } from '@/components/MemoryOrb';
import { useMemoryOrbs } from '@/hooks/useMemoryOrbs';
import { useAuth } from '@/contexts/AuthContext';
import { MemoryOrb as MemoryOrbType, EMOTION_COLORS, EmotionType } from '@/types';

export const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { calendarEntries, loadOrbs, orbs } = useMemoryOrbs();
  const { checkAuth, isAuthenticated } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrbs();
    }
  }, [isAuthenticated, loadOrbs]);

  const handleOrbClick = (orb: MemoryOrbType) => {
    navigate(`/calendar/detail/${orb.diaryId}`);
  };

  const handleDateClick = (date: Date) => {
    // 날짜 클릭 시 해당 날짜의 일기 상세 보기
    const dateStr = date.toISOString().split('T')[0];
    const entry = calendarEntries.find(e => e.date.startsWith(dateStr));
    if (entry && entry.orbs.length > 0) {
      // 하루에 1개의 일기만 있으므로 첫 번째 일기로 이동
      navigate(`/calendar/detail/${entry.orbs[0].diaryId}`);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
  const today = new Date();
  const isCurrentMonth = 
    year === today.getFullYear() && 
    month === today.getMonth();

  const getOrbForDate = (day: number): MemoryOrbType | null => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = calendarEntries.find(e => e.date.startsWith(dateStr));
    // 하루에 1개의 일기만 있으므로 첫 번째 구슬만 반환
    return entry?.orbs?.[0] || null;
  };

  const formatMonthYear = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setSelectedMonth(new Date());
  };

  const emotionLabels: Record<EmotionType, string> = {
    happy: '기쁨',
    sad: '슬픔',
    angry: '화남',
    anxious: '불안',
    calm: '평온',
    excited: '설렘',
    grateful: '감사',
    lonely: '외로움',
  };

  return (
    <div className="mobile-container pb-20 min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100">
      {/* Back Button - 왼쪽 위 */}
      <div className="safe-area-top p-4">
        <motion.button
          onClick={() => navigate('/home')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xl text-gray-700">←</span>
        </motion.button>
      </div>

      {/* Month Navigation - Header 대신 간단한 네비게이션 */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-md">
          <motion.button
            onClick={goToPreviousMonth}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl font-bold text-gray-700">‹</span>
          </motion.button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-1">{formatMonthYear(selectedMonth)}</h2>
            {isCurrentMonth && (
              <button
                onClick={goToToday}
                className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full hover:bg-purple-200 transition-all"
              >
                오늘로 이동
              </button>
            )}
          </div>

          <motion.button
            onClick={goToNextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl font-bold text-gray-700">›</span>
          </motion.button>
        </div>
      </div>

      {/* Bookshelf Style Calendar */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-semibold py-2 ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid - Bookshelf Style */}
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="h-20 bg-gray-50 rounded-lg border border-gray-100"
              />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const orb = getOrbForDate(day);
              const isToday =
                isCurrentMonth &&
                day === today.getDate();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const hasOrb = orb !== null;

              return (
                <motion.div
                  key={day}
                  className={`h-20 p-2 rounded-lg border-2 transition-all cursor-pointer relative overflow-hidden ${
                    isToday
                      ? 'border-purple-500 bg-purple-50 shadow-md scale-105'
                      : hasOrb
                      ? 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-md'
                      : isWeekend
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDateClick(date)}
                >
                  {/* Date Number */}
                  <div
                    className={`text-xs font-semibold mb-1 ${
                      isToday
                        ? 'text-purple-700 font-bold'
                        : isWeekend
                        ? 'text-gray-500'
                        : 'text-gray-700'
                    }`}
                  >
                    {isToday && (
                      <span className="inline-block w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs mr-1">
                        {day}
                      </span>
                    )}
                    {!isToday && day}
                  </div>

                  {/* Memory Orb - 하루에 1개만 표시 */}
                  {orb && (
                    <div className="flex justify-center items-center h-full pt-1">
                      <motion.div
                        className={`relative ${orb.isReinterpreted ? 'ring-2 ring-yellow-300 ring-opacity-75 rounded-full' : ''}`}
                        whileHover={{ scale: 1.2, zIndex: 10 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrbClick(orb);
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          delay: orb.isReinterpreted ? 0 : 0.1,
                          type: 'spring',
                          stiffness: 200
                        }}
                      >
                        <MemoryOrb
                          orb={orb}
                          size="sm"
                          showGlitter={orb.isReinterpreted}
                          onClick={() => {
                            handleOrbClick(orb);
                          }}
                        />
                        {/* 재해석된 구슬 표시 - 별 아이콘 */}
                        {orb.isReinterpreted && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-3 h-3 flex items-center justify-center bg-yellow-400 rounded-full shadow-md"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ 
                              delay: 0.2,
                              type: 'spring',
                              stiffness: 200
                            }}
                          >
                            <span className="text-[8px]">✨</span>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  )}

                  {/* Bookshelf decoration - 책장 느낌 */}
                  {hasOrb && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 opacity-30"></div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legend - 감정 색상 가이드 */}
        <div className="mt-6 bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="text-base font-bold mb-4 text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            감정 색상 가이드
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(EMOTION_COLORS) as EmotionType[]).map((emotion) => (
              <motion.div
                key={emotion}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <div
                  className="w-6 h-6 rounded-full shadow-sm border-2 border-white"
                  style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {emotionLabels[emotion]}
                </span>
              </motion.div>
            ))}
          </div>

          {/* 통계 정보 */}
          <div className="mt-5 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{orbs.length}</div>
                <div className="text-xs text-gray-600 mt-1">전체 구슬</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {orbs.filter(o => o.isReinterpreted).length}
                </div>
                <div className="text-xs text-gray-600 mt-1">재해석 구슬</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
