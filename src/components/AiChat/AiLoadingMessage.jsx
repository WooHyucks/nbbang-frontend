import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const CREATE_LOADING_MESSAGES = [
    'Gemini가 정산을 시작했어요',
    '조금만 기다려주세요!',
    '가격 확인 중...',
    '데이터를 정리하고 있어요',
    '거의 다 됐어요!',
];

const MODIFY_LOADING_MESSAGES = [
    'AI가 내용을 수정하고 있어요...',
    '변경 사항을 반영 중이에요',
    '조금만 기다려주세요!',
    '거의 다 됐어요!',
];

const AiLoadingMessage = ({ isModifyMode = false }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    const loadingMessages = isModifyMode
        ? MODIFY_LOADING_MESSAGES
        : CREATE_LOADING_MESSAGES;

    useEffect(() => {
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setCurrentMessageIndex(
                    (prev) => (prev + 1) % loadingMessages.length,
                );
                setIsFading(false);
            }, 300); // 페이드 아웃 시간
        }, 2500); // 2.5초마다 메시지 변경

        return () => clearInterval(interval);
    }, [loadingMessages.length]);

    return (
        <div className="flex items-start gap-3 w-full justify-start">
            <div className="flex-shrink-0 mt-1">
                <Sparkles
                    size={18}
                    className="text-[#3182F6] animate-spin"
                    style={{
                        animation: 'spin 2s linear infinite',
                    }}
                />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 max-w-[75%] relative min-h-[44px] flex items-center">
                {/* 모든 메시지를 absolute로 겹쳐서 배치 */}
                {loadingMessages.map((message, index) => (
                    <p
                        key={index}
                        className={`absolute inset-0 flex items-center text-sm text-gray-900 transition-opacity duration-300 px-4 py-3 ${
                            index === currentMessageIndex
                                ? isFading
                                    ? 'opacity-0'
                                    : 'opacity-100'
                                : 'opacity-0 pointer-events-none'
                        }`}
                    >
                        {message}
                    </p>
                ))}
                {/* 레이아웃 유지를 위한 투명 텍스트 */}
                <p className="invisible text-sm px-4 py-3">
                    {loadingMessages[currentMessageIndex]}
                </p>
            </div>
        </div>
    );
};

export default AiLoadingMessage;
