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
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrbs();
    }
  }, [isAuthenticated, loadOrbs]);

  const handleOrbClick = (orb: MemoryOrbType, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/calendar/detail/${orb.diaryId}`);
  };

  const handleDateCellClick = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const orbs = getOrbsForDate(day);
    if (orbs.length > 0) {
      // 같은 날짜를 다시 클릭하면 닫기
      if (expandedDay === day) {
        setExpandedDay(null);
      } else {
        // 다른 날짜 클릭하면 확장
        setExpandedDay(day);
      }
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

  const getOrbsForDate = (day: number): MemoryOrbType[] => {
    // 정확한 날짜 매칭: YYYY-MM-DD 형식
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // calendarEntries에서 정확한 날짜와 일치하는 엔트리 찾기
    const entry = calendarEntries.find(e => {
      // e.date는 YYYY-MM-DD 형식이거나 ISO 형식일 수 있으므로 startsWith 대신 정확히 비교
      const entryDateStr = e.date.split('T')[0]; // ISO 형식에서 날짜 부분만 추출
      return entryDateStr === targetDateStr;
    });
    
    return entry?.orbs || [];
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

  // 선택된 달의 모든 구슬 가져오기
  const getOrbsForSelectedMonth = (): MemoryOrbType[] => {
    const targetYear = year;
    const targetMonth = month + 1; // month는 0-based이므로 1을 더함
    const monthOrbs: MemoryOrbType[] = [];
    
    calendarEntries.forEach(entry => {
      // entry.date에서 날짜 부분만 추출 (YYYY-MM-DD 형식)
      const entryDateStr = entry.date.split('T')[0];
      const entryDate = new Date(entryDateStr + 'T00:00:00');
      
      // 해당 월의 구슬인지 확인
      if (entryDate.getFullYear() === targetYear && entryDate.getMonth() + 1 === targetMonth) {
        monthOrbs.push(...entry.orbs);
      }
    });
    
    return monthOrbs;
  };

  // 선택된 달의 감정별 구슬 개수 계산
  const getEmotionCountsForMonth = (): Record<EmotionType, number> => {
    const monthOrbs = getOrbsForSelectedMonth();
    const counts: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      calm: 0,
      excited: 0,
      grateful: 0,
      lonely: 0,
    };
    
    monthOrbs.forEach(orb => {
      if (orb.emotion && counts.hasOwnProperty(orb.emotion)) {
        counts[orb.emotion as EmotionType]++;
      }
    });
    
    return counts;
  };

  const emotionCounts = getEmotionCountsForMonth();

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
            <button
              onClick={goToToday}
              className={`text-xs px-3 py-1 rounded-full transition-all ${
                isCurrentMonth
                  ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  : 'bg-purple-500 text-white hover:bg-purple-600 shadow-md'
              }`}
            >
              오늘로 이동
            </button>
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
              const orbs = getOrbsForDate(day);
              const isToday =
                isCurrentMonth &&
                day === today.getDate();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const hasOrbs = orbs.length > 0;
              const isExpanded = expandedDay === day;

              return (
                <React.Fragment key={day}>
                  <motion.div
                    className={`p-2 rounded-lg border-2 transition-all relative overflow-hidden ${
                      isExpanded
                        ? 'col-span-7 min-h-[200px] mb-2'
                        : 'h-20'
                    } ${
                      isToday
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : hasOrbs
                        ? 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-md'
                        : isWeekend
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${hasOrbs ? 'cursor-pointer' : ''}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      height: isExpanded ? 'auto' : '80px',
                    }}
                    transition={{ delay: index * 0.01, duration: 0.3 }}
                    onClick={(e) => hasOrbs && handleDateCellClick(day, e)}
                    layout
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

                    {/* Memory Orbs - 축소 상태 */}
                    {!isExpanded && (
                      <div className="flex flex-wrap gap-1 justify-center items-center">
                        {orbs.slice(0, 3).map((orb) => (
                          <motion.div
                            key={orb.id}
                            whileHover={{ scale: 1.2, zIndex: 10 }}
                            onClick={(e) => handleOrbClick(orb, e)}
                            className="cursor-pointer"
                          >
                            <MemoryOrb
                              orb={orb}
                              size="sm"
                              showGlitter={orb.isReinterpreted}
                            />
                          </motion.div>
                        ))}
                        {orbs.length > 3 && (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-[8px] font-bold shadow-sm">
                            +{orbs.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Memory Orbs - 확장 상태 */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4"
                      >
                        <div className="text-center mb-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-2">
                            {day}일의 구슬 {orbs.length}개
                          </h4>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 justify-items-center">
                          {orbs.map((orb, orbIndex) => (
                            <motion.div
                              key={orb.id}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: orbIndex * 0.05 }}
                              whileHover={{ scale: 1.15, y: -5, zIndex: 10 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => handleOrbClick(orb, e)}
                              className="cursor-pointer relative"
                            >
                              <MemoryOrb
                                orb={orb}
                                size="lg"
                                showGlitter={orb.isReinterpreted}
                              />
                              {/* 호버 시 감정 라벨 */}
                              <motion.div
                                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                              >
                                {emotionLabels[orb.emotion]}
                              </motion.div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Bookshelf decoration - 책장 느낌 */}
                    {hasOrbs && !isExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 opacity-30"></div>
                    )}
                  </motion.div>
                </React.Fragment>
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
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full shadow-sm border-2 border-white"
                    style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {emotionLabels[emotion]}
                  </span>
                </div>
                <span className="text-sm font-bold text-purple-600">
                  {emotionCounts[emotion]}개
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
                <div className="text-xs text-gray-600 mt-1">되새김 구슬</div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};
