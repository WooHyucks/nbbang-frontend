import React from 'react';
import { motion } from 'framer-motion';

/**
 * 사용자 요청사항을 표시하는 말풍선 컴포넌트 (카카오톡 스타일)
 * @param {string} userPrompt - 사용자가 입력한 요청사항
 */
const UserPromptBubble = ({ userPrompt }) => {
    // userPrompt가 없으면 렌더링하지 않음
    if (!userPrompt || !userPrompt.trim()) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex justify-end mb-4 px-1"
        >
            <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
                <div className="relative bg-[#3182F6] text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                    {/* 말풍선 꼬리표 (오른쪽) */}
                    <div className="absolute right-0 top-0 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-[#3182F6] transform translate-x-[8px] -translate-y-[8px]" />
                    
                    {/* 텍스트 내용 */}
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                        {userPrompt}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default UserPromptBubble;


