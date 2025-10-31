import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CapsuleMachine } from '@/components/CapsuleMachine';
import { NavButtons } from '@/components/NavButtons';
import { useMemoryOrbs } from '@/hooks/useMemoryOrbs';
import { useAuth } from '@/contexts/AuthContext';
import { MemoryOrb } from '@/types';
import capsuleMachineImage from '@/assets/capsule-machine.png';
import logoImage from '@/assets/logo.png';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { orbs, loadOrbs } = useMemoryOrbs();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadOrbs();
    }
  }, [user, loadOrbs]);

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
          {/* Logo - Capsule Machine 위에 */}
          <div className="flex justify-center mb-4">
            <motion.img
              src={logoImage}
              alt="Logo"
              className="h-12 w-auto object-contain"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
          </div>

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
                <div className="text-sm text-gray-600 mt-1">다시빛 구슬</div>
              </div>
            </div>
          </div>

          {/* User Greeting */}
          <div className="mt-6 pointer-events-none">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-2xl shadow-lg pointer-events-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {user ? (
                <>
                  <h2 className="text-xl font-bold mb-1">
                    안녕하세요, {user.name}님
                  </h2>
                  <p className="text-purple-100 text-sm">오늘도 소중한 하루 보내세요</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-1">
                    로그인 해주세요
                  </h2>
                  <p className="text-purple-100 text-sm mb-3">일기를 작성하고 메모리 구슬을 모아보세요</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-2 bg-white text-purple-500 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                  >
                    로그인하기
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <NavButtons />
    </div>
  );
};
