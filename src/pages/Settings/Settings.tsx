import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const settingsSections = [
    {
      title: '계정 설정',
      items: [
        { label: '프로필 수정', onClick: () => alert('프로필 수정 기능은 추후 구현 예정입니다.') },
        { label: '비밀번호 변경', onClick: () => alert('비밀번호 변경 기능은 추후 구현 예정입니다.') },
        { label: '계정 삭제', onClick: () => alert('계정 삭제 기능은 추후 구현 예정입니다.'), danger: true },
      ],
    },
    {
      title: '알림 설정',
      items: [
        { label: '푸시 알림', onClick: () => alert('푸시 알림 설정은 추후 구현 예정입니다.') },
        { label: '이메일 알림', onClick: () => alert('이메일 알림 설정은 추후 구현 예정입니다.') },
      ],
    },
    {
      title: '앱 설정',
      items: [
        { label: '다국어', onClick: () => alert('다국어 설정은 추후 구현 예정입니다.') },
        { label: '테마', onClick: () => alert('테마 설정은 추후 구현 예정입니다.') },
        { label: '개인정보 처리방침', onClick: () => alert('개인정보 처리방침은 추후 구현 예정입니다.') },
        { label: '이용약관', onClick: () => alert('이용약관은 추후 구현 예정입니다.') },
      ],
    },
  ];

  return (
    <div className="mobile-container min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="safe-area-top bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 text-lg mr-4"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold">설정</h1>
      </header>

      {/* Settings Content */}
      <main className="p-6">
        {/* User Info */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name[0] || 'U'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{user?.name || '사용자'}</h3>
              <p className="text-sm text-gray-600">{user?.email || '이메일'}</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 px-2">
              {section.title}
            </h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={item.onClick}
                  className={`w-full py-4 px-6 border-b border-gray-100 last:border-b-0 flex items-center justify-between active:bg-gray-50 ${
                    item.danger ? 'text-red-500' : 'text-gray-800'
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-gray-400">→</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* App Version */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>마음구슬일기 v1.0.0</p>
        </div>
      </main>
    </div>
  );
};

