import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendEventToAmplitude } from '../../utils/amplitude';
import ToastPopUp from '../common/ToastPopUp';

/**
 * AI 이미지 분석 제한 모달 컴포넌트
 * @param {boolean} isOpen - 모달 열림 상태
 * @param {Function} onClose - 모달 닫기 핸들러
 * @param {'personal' | 'server'} type - 에러 타입 ('personal': 403, 'server': 503)
 * @param {Function} onSwitchToText - 텍스트 모드로 전환 핸들러
 */
const AiAnalysisLimitModal = ({ isOpen, onClose, type, onSwitchToText }) => {
    const isPersonalLimit = type === 'personal';
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    // 모달이 닫힐 때 상태 초기화
    useEffect(() => {
        if (!isOpen) {
            setShowFeedbackInput(false);
            setFeedbackMessage('');
        }
    }, [isOpen]);

    const handleFeedbackClick = (feedbackType, feedbackText) => {
        // Amplitude 이벤트 전송
        sendEventToAmplitude('ai analysis limit feedback', {
            feedback_type: feedbackType, // 'POSITIVE', 'NEUTRAL', 'NEGATIVE'
            limit_type: 'personal',
        });

        // 토스트 표시
        setToastMessage('소중한 의견 감사합니다! 🙇‍♂️');
        setShowToast(true);

        // 모달 닫고 텍스트 입력 모드로 전환
        setTimeout(() => {
            if (onSwitchToText) {
                onSwitchToText();
            }
            onClose();
        }, 500); // 토스트가 보이도록 약간의 딜레이
    };

    const handleSubmitFeedback = () => {
        if (!feedbackMessage.trim()) {
            return;
        }

        // Amplitude 이벤트 전송 (의견 메시지 포함)
        sendEventToAmplitude('ai settlement survey feedback message', {
            message: feedbackMessage.trim(),
            limit_type: 'personal',
        });

        // 토스트 표시
        setToastMessage('소중한 의견 감사합니다! 🙇‍♂️');
        setShowToast(true);

        // 상태 초기화 및 모달 닫기
        setFeedbackMessage('');
        setShowFeedbackInput(false);
        setTimeout(() => {
            if (onSwitchToText) {
                onSwitchToText();
            }
            onClose();
        }, 500);
    };

    const handleTextModeClick = () => {
        if (onSwitchToText) {
            onSwitchToText();
        }
        onClose();
    };

    return (
        <>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                                {/* 헤더 */}
                                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {isPersonalLimit
                                                ? '⚡️ 오늘의 AI 에너지가 모두 소진되었어요!'
                                                : '오늘 준비된 AI 서버가 매진되었어요! 😱'}
                                        </h3>
                                        <button
                                            onClick={onClose}
                                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors active:scale-95"
                                            aria-label="닫기"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* 내용 */}
                                <div className="px-6 py-5">
                                    {isPersonalLimit ? (
                                        <>
                                            <p className="text-sm text-gray-600 leading-relaxed mb-6">
                                                베타 기간이라 하루 5회 제한이 있어요. 😭
                                                <br />
                                                <br />
                                                <span className="font-semibold text-gray-900">
                                                    지금까지 써보신 AI 정산 기능, 어떠셨나요?
                                                </span>
                                                <br />
                                                버튼을 눌러주시면 서비스 발전에 큰 도움이 됩니다!
                                            </p>

                                            {/* 피드백 버튼 그리드 */}
                                            <div className="grid grid-cols-1 gap-3 mb-6">
                                                <button
                                                    onClick={() => handleFeedbackClick('POSITIVE', '완전 편해요!')}
                                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all font-semibold text-gray-900 active:scale-95"
                                                >
                                                    <span className="text-2xl">😍</span>
                                                    <span className="text-base">완전 편해요!</span>
                                                </button>
                                                <button
                                                    onClick={() => handleFeedbackClick('NEUTRAL', '살짝 아쉬워요')}
                                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all font-semibold text-gray-900 active:scale-95"
                                                >
                                                    <span className="text-2xl">🤔</span>
                                                    <span className="text-base">살짝 아쉬워요</span>
                                                </button>
                                                <button
                                                    onClick={() => handleFeedbackClick('NEGATIVE', '직접 입력이 편해요')}
                                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all font-semibold text-gray-900 active:scale-95"
                                                >
                                                    <span className="text-2xl">🔙</span>
                                                    <span className="text-base">직접 입력이 편해요</span>
                                                </button>
                                            </div>

                                            {/* 의견 남기기 섹션 */}
                                            {!showFeedbackInput ? (
                                                <button
                                                    onClick={() => setShowFeedbackInput(true)}
                                                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 mb-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold active:scale-95"
                                                >
                                                    <MessageSquare size={18} />
                                                    의견 남기기
                                                </button>
                                            ) : (
                                                <div className="mb-3">
                                                    <textarea
                                                        value={feedbackMessage}
                                                        onChange={(e) => setFeedbackMessage(e.target.value)}
                                                        placeholder="의견을 자유롭게 남겨주세요..."
                                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3182F6] resize-none text-sm"
                                                        rows={4}
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => {
                                                                setShowFeedbackInput(false);
                                                                setFeedbackMessage('');
                                                            }}
                                                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium active:scale-95"
                                                        >
                                                            취소
                                                        </button>
                                                        <button
                                                            onClick={handleSubmitFeedback}
                                                            disabled={!feedbackMessage.trim()}
                                                            className="flex-1 px-4 py-2 bg-[#3182F6] text-white rounded-lg hover:bg-[#1E6FFF] transition-all font-semibold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            제출하기
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Footer Action */}
                                            <button
                                                onClick={handleTextModeClick}
                                                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold active:scale-95"
                                            >
                                                <MessageSquare size={18} />
                                                텍스트로 계속 정산하기
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-600 leading-relaxed mb-6">
                                                폭발적인 인기로 오늘 서버 용량이 모두 소진되었습니다. (내일 0시 재개)
                                                <br />
                                                지금은 텍스트 입력으로 정산해 보세요.
                                            </p>

                                            <button
                                                onClick={handleTextModeClick}
                                                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#3182F6] text-white rounded-xl hover:bg-[#1E6FFF] transition-all font-semibold active:scale-95 shadow-sm"
                                            >
                                                <MessageSquare size={18} />
                                                텍스트로 정산하러 가기
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* 감사 토스트 */}
            {showToast && (
                <ToastPopUp
                    message={toastMessage}
                    setToastPopUp={setShowToast}
                    type="success"
                />
            )}
        </>
    );
};

export default AiAnalysisLimitModal;

