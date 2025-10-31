import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithOAuth, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    try {
      await loginWithOAuth(provider);
      navigate('/home');
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-purple-200 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        {/* App Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-2">마음 구슬 다이어리</h1>
          <p className="text-gray-600">당신의 마음을 기록하세요</p>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="mb-6">
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          {error && (
            <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed active:bg-purple-600"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">또는</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="w-full py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed active:bg-gray-50"
          >
            구글 로그인
          </button>
          <button
            onClick={() => handleOAuthLogin('kakao')}
            disabled={isLoading}
            className="w-full py-3 bg-yellow-300 rounded-xl font-semibold text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed active:bg-yellow-400"
          >
            카카오 로그인
          </button>
          <button
            onClick={() => handleOAuthLogin('naver')}
            disabled={isLoading}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed active:bg-green-600"
          >
            네이버 로그인
          </button>
        </div>
      </div>
    </div>
  );
};

