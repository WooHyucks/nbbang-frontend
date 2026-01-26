import React from 'react';
import { Sparkles } from 'lucide-react';

const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';

    return (
        <div
            className={`flex items-start gap-2 sm:gap-3 w-full ${
                isUser ? 'justify-end' : 'justify-start'
            }`}
        >
            {/* AI 아이콘 (AI 메시지일 때만) */}
            {!isUser && (
                <div className="flex-shrink-0 mt-1">
                    <Sparkles size={18} className="text-[#3182F6]" />
                </div>
            )}

            <div
                className={`w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] ${
                    isUser ? 'flex justify-end' : ''
                }`}
            >
                <div
                    className={`rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 ${
                        isUser
                            ? 'bg-[#3182F6] text-white rounded-br-sm shadow-sm'
                            : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200 shadow-sm'
                    }`}
                >
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                        {message.text}
                    </p>
                    {message.timestamp && (
                        <p
                            className={`text-xs mt-2.5 ${
                                isUser ? 'text-blue-100' : 'text-gray-400'
                            }`}
                        >
                            {message.timestamp}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
