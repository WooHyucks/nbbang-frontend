import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AiResultLoading = () => {
    const [messageIndex, setMessageIndex] = useState(0);
    const messages = [
        "정산 내용을 정리 중이에요!",
        "조금만 기다려주세요!",
        "AI가 열심히 계산하고 있어요 🤖",
        "거의 다 됐어요!"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-white w-full fixed top-0 left-0 z-50">
            <motion.div
                animate={{
                    y: [0, -15, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="text-7xl mb-10 filter drop-shadow-xl"
            >
                🧾
            </motion.div>
            
            <div className="h-8 relative w-full text-center flex justify-center items-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={messageIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="text-[#191F28] font-bold text-xl absolute px-6 font-['Pretendard']"
                    >
                        {messages[messageIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>
            
            {/* 토스 스타일 진행바 */}
            <div className="w-[200px] h-[6px] bg-[#F2F4F6] rounded-full mt-12 overflow-hidden relative">
                <motion.div 
                    className="h-full bg-[#3182F6] absolute left-0 top-0 rounded-full"
                    animate={{ width: ["0%", "80%", "100%"], left: ["0%", "20%", "100%"] }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 1.5, 
                        ease: "easeOut",
                        times: [0, 0.7, 1] 
                    }}
                    style={{ width: "30%" }}
                />
            </div>
        </div>
    );
};

export default AiResultLoading;
