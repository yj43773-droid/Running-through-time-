import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavButtonsProps {
  className?: string;
}

export const NavButtons: React.FC<NavButtonsProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/calendar', icon: '📅', label: '달력' },
    { path: '/write', icon: '✍️', label: '일기쓰기' },
    { path: '/mypage', icon: '👤', label: '마이페이지' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50 ${className}`}>
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors relative ${
                isActive(item.path) ? 'text-purple-500' : 'text-gray-500'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive(item.path) && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-t-full"
                  layoutId="activeTab"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );
};

