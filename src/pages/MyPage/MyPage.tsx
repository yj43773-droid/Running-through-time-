import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useMemoryOrbs } from '@/hooks/useMemoryOrbs';
import { EMOTION_COLORS, EmotionType } from '@/types';

export const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, checkAuth, isAuthenticated, logout } = useAuth();
  const { orbStats, loadOrbs } = useMemoryOrbs();

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

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

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

  const totalOrbs = Object.values(orbStats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="mobile-container pb-20 min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
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

      {/* Profile Section */}
      <main className="p-6 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* User Profile */}
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                {user.name[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">메모리 구슬 통계</h3>
            <div className="mb-4">
              <div className="text-3xl font-bold text-purple-600 text-center mb-2">
                {totalOrbs}
              </div>
              <div className="text-sm text-gray-600 text-center">전체 구슬</div>
            </div>

            {/* Emotion Stats */}
            <div className="space-y-3">
              {(Object.keys(orbStats) as EmotionType[]).map((emotion) => {
                const count = orbStats[emotion];
                const percentage = totalOrbs > 0 ? (count / totalOrbs) * 100 : 0;

                return (
                  <div key={emotion} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                        />
                        <span className="font-medium">{emotionLabels[emotion]}</span>
                      </div>
                      <span className="text-gray-600">
                        {count}개 ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSettingsClick}
              className="w-full py-4 bg-white rounded-xl shadow-md text-left px-6 flex items-center justify-between active:bg-gray-50"
            >
              <span className="font-semibold text-gray-800">⚙️ 설정</span>
              <span className="text-gray-400">→</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-white rounded-xl shadow-md text-left px-6 flex items-center justify-between active:bg-gray-50"
            >
              <span className="font-semibold text-red-500">🚪 로그아웃</span>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </motion.div>
      </main>

    </div>
  );
};

