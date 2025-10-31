import React, { useState } from 'react';

interface ReplyInputProps {
  placeholder?: string;
  onSubmit: (reply: string) => void;
  disabled?: boolean;
}

export const ReplyInput: React.FC<ReplyInputProps> = ({
  placeholder = '답변을 입력하세요...',
  onSubmit,
  disabled = false,
}) => {
  const [reply, setReply] = useState('');

  const handleSubmit = () => {
    if (reply.trim() && !disabled) {
      onSubmit(reply.trim());
      setReply('');
    }
  };

  return (
    <div className="w-full">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-h-[100px] p-4 border-2 border-gray-300 rounded-xl resize-none focus:outline-none focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        rows={4}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !reply.trim()}
        className="mt-3 w-full py-3 bg-purple-500 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed active:bg-purple-600"
      >
        전송하기
      </button>
    </div>
  );
};

