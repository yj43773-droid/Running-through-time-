import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CapsuleMachine } from '@/components/CapsuleMachine';
import { NavButtons } from '@/components/NavButtons';
import { useMemoryOrbs } from '@/hooks/useMemoryOrbs';
import { useAuth } from '@/contexts/AuthContext';
import { MemoryOrb } from '@/types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { orbs, loadOrbs } = useMemoryOrbs();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Always try to load orbs (will be empty if not authenticated)
    loadOrbs();
  }, [loadOrbs]);

  const handleOrbClick = (orb: MemoryOrb) => {
    navigate(`/calendar/detail/${orb.diaryId}`);
  };

  return (
    <div className="mobile-container pb-20">
      {/* Header */}
      <header className="safe-area-top bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-b-3xl shadow-lg">
        <h2 className="text-2xl font-bold mb-1">
          안녕하세요, {user?.name || '게스트'}님
        </h2>
        <p className="text-purple-100">오늘도 소중한 하루 보내세요</p>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Capsule Machine */}
          <CapsuleMachine orbs={orbs} onOrbClick={handleOrbClick} />

          {/* Stats Section */}
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-4">통계</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">{orbs.length}</div>
                <div className="text-sm text-gray-600 mt-1">전체 구슬</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-500">
                  {orbs.filter(o => o.isReinterpreted).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">재해석 구슬</div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <NavButtons />
    </div>
  );
};

