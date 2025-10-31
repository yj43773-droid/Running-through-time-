import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  // 로그인 페이지 접근 시 자동으로 홈으로 리다이렉트
  useEffect(() => {
    navigate('/home', { replace: true });
  }, [navigate]);

  // 리다이렉트 중일 때는 로딩 표시
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-purple-200">
      <div className="text-gray-600">리다이렉트 중...</div>
    </div>
  );
};

