import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CapsuleMachine } from '@/components/CapsuleMachine';
import { NavButtons } from '@/components/NavButtons';
import { useMemoryOrbs } from '@/hooks/useMemoryOrbs';
import { useAuth } from '@/contexts/AuthContext';
import { MemoryOrb } from '@/types';
import capsuleMachineImage from '@/assets/capsule-machine.png';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { orbs, loadOrbs } = useMemoryOrbs();
  const { user } = useAuth();

  useEffect(() => {
    // Always try to load orbs (will be empty if not authenticated)
    loadOrbs();
  }, [loadOrbs]);

  const handleOrbClick = (orb: MemoryOrb) => {
    navigate(`/calendar/detail/${orb.diaryId}`);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-gray-50 pb-24">
      {/* Main Content */}
      <main className="w-full p-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Capsule Machine */}
          <div className="mb-4">
            <CapsuleMachine 
              orbs={orbs} 
              onOrbClick={handleOrbClick}
              machineImage={capsuleMachineImage}
            />
          </div>

          {/* Stats Section */}
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-md">
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

      {/* User Greeting - Bottom */}
      <div className="fixed bottom-32 left-0 right-0 z-30 pointer-events-none">
        <div className="w-full max-w-md mx-auto px-4">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-2xl shadow-lg pointer-events-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-xl font-bold mb-1">
              안녕하세요, {user?.name || '게스트'}님
            </h2>
            <p className="text-purple-100 text-sm">오늘도 소중한 하루 보내세요</p>
          </motion.div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <NavButtons />
    </div>
  );
};
