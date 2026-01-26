import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
    PatchBillingUserKaKaoDeposit,
    PatchBillingMeetingKakaoDeposit,
} from '../../api/api';
import KakaoIdExplain from './KakaoIdExplain';
import { sendEventToAmplitude } from '@/utils/amplitude';
import ToastPopUp from '@/components/common/ToastPopUp';

const BillingKakaoModal = ({ setKakaoModalOpen, meetingName, user }) => {
    const { meetingId: urlMeetingId } = useParams();
    const meetingId = urlMeetingId || meetingName?.id; // URL에서 가져오거나 meetingName에서 가져오기
    const [kakaoId, setKakaoId] = useState(
        meetingName?.kakao_deposit_information?.kakao_deposit_id ||
            user?.kakaoDepositInformation?.kakaoDepositId ||
            meetingName?.kakaoDepositInformation?.kakaoDepositId ||
            '',
    );
    const [showExplainModal, setShowExplainModal] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [toastPopUp, setToastPopUp] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // 미팅 ID가 없을 때는 기본적으로 "계속해서 사용하기"만 사용
    useEffect(() => {
        if (!meetingId) {
            setActionType('계속해서 사용하기');
        }
    }, [meetingId]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleSave = async (action) => {
        if (!kakaoId.trim()) {
            setToastMessage('카카오톡 ID를 입력해주세요.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }

        try {
            setIsSaving(true);
            const lastSlashIndex = kakaoId.trim().split('/');
            const extractedString = lastSlashIndex[lastSlashIndex.length - 1];
            const formData = { kakao_deposit_id: extractedString };

            if (action === '이번에만 사용하기' && meetingId) {
                const responsePostData = await PatchBillingMeetingKakaoDeposit(
                    meetingId,
                    formData,
                );
                if (responsePostData.status === 200) {
                    sendEventToAmplitude('complete kakao deposit id register', {
                        action: '이번에만 사용하기',
                    });
                    setKakaoModalOpen(false);
                    setToastMessage('카카오페이 계정이 설정되었습니다.');
                    setToastType('success');
                    setToastPopUp(true);
                }
            } else if (action === '계속해서 사용하기') {
                await PatchBillingUserKaKaoDeposit(formData);
                if (meetingId) {
                    const responsePostData =
                        await PatchBillingMeetingKakaoDeposit(
                            meetingId,
                            formData,
                        );
                    if (responsePostData.status === 200) {
                        sendEventToAmplitude(
                            'complete kakao deposit id register',
                            {
                                action: '계속해서 사용하기',
                            },
                        );
                        setKakaoModalOpen(false);
                        setToastMessage('카카오페이 계정이 설정되었습니다.');
                        setToastType('success');
                        setToastPopUp(true);
                    }
                } else {
                    // meetingId가 없으면 사용자 정보만 업데이트
                    sendEventToAmplitude('complete kakao deposit id register', {
                        action: '계속해서 사용하기',
                    });
                    setKakaoModalOpen(false);
                    setToastMessage('카카오페이 계정이 설정되었습니다.');
                    setToastType('success');
                    setToastPopUp(true);
                }
            }
        } catch (error) {
            console.log('Api 데이터 수정 실패');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async () => {
        try {
            const emptyFormData = { kakao_deposit_id: '' };
            await PatchBillingUserKaKaoDeposit(emptyFormData);
            if (meetingId) {
                const responsePostData = await PatchBillingMeetingKakaoDeposit(
                    meetingId,
                    emptyFormData,
                );
                if (responsePostData.status === 200) {
                    setKakaoModalOpen(false);
                }
            } else {
                setKakaoModalOpen(false);
            }
        } catch (error) {
            console.log('Api 데이터 수정 실패');
        }
    };

    const handleSubmit = () => {
        // 미팅이 없을 때는 기본값으로 처리
        const effectiveAction = meetingId ? actionType : '계속해서 사용하기';
        if (!effectiveAction) {
            setToastMessage('사용 방식을 선택해주세요.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }
        handleSave(effectiveAction);
    };

    return (
        <>
            <AnimatePresence mode="wait">
                <motion.div
                    key="kakao-modal-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setKakaoModalOpen(false)}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 400,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg mx-auto"
                    >
                        {/* 핸들 바 */}
                        <div className="pt-3 pb-4 px-6 border-b border-black/[0.06] rounded-t-[32px]">
                            <div className="w-10 h-1 bg-[#e5e5ea] rounded-full mx-auto mb-4" />
                            <div className="flex items-center justify-between">
                                <h2 className="text-[20px] font-bold text-[#191f28]">
                                    카카오페이 연동
                                </h2>
                                <button
                                    onClick={() => setKakaoModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f2f7] transition-colors"
                                >
                                    <X
                                        size={20}
                                        className="text-[#8e8e93]"
                                        strokeWidth={2.5}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* 카카오톡 ID 입력 */}
                            <div>
                                <label className="block text-[13px] font-semibold text-[#191f28] mb-2">
                                    카카오톡 ID
                                </label>
                                <input
                                    type="text"
                                    value={
                                        kakaoId ||
                                        user?.kakaoDepositInformation
                                            ?.kakaoDepositId
                                    }
                                    onChange={(e) => setKakaoId(e.target.value)}
                                    placeholder="카카오톡 ID를 입력하세요"
                                    className="w-full h-14 px-4 bg-[#f2f2f7] rounded-2xl border-none outline-none text-[15px] placeholder:text-[#c7c7cc] focus:bg-[#e5e5ea] transition-colors"
                                    autoComplete="off"
                                />
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-[12px] text-[#8e8e93]">
                                        카카오톡 프로필의 ID를 입력해주세요
                                    </p>
                                    <button
                                        onClick={() =>
                                            setShowExplainModal(true)
                                        }
                                        className="text-[12px] text-[#0084ff] underline"
                                    >
                                        카카오톡 ID란?
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-semibold text-[#191f28] mb-3">
                                    사용 방식
                                </label>
                                <div className="space-y-2">
                                    <button
                                        onClick={() =>
                                            setActionType('이번에만 사용하기')
                                        }
                                        className={`w-full h-12 px-4 rounded-xl text-[14px] font-medium transition-all ${
                                            actionType === '이번에만 사용하기'
                                                ? 'bg-[#fee500] text-[#191f28] shadow-lg shadow-[#fee500]/20'
                                                : 'bg-[#f2f2f7] text-[#191f28] hover:bg-[#e5e5ea]'
                                        }`}
                                    >
                                        이번에만 사용하기
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActionType('계속해서 사용하기')
                                        }
                                        className={`w-full h-12 px-4 rounded-xl text-[14px] font-medium transition-all ${
                                            actionType === '계속해서 사용하기'
                                                ? 'bg-[#fee500] text-[#191f28] shadow-lg shadow-[#fee500]/20'
                                                : 'bg-[#f2f2f7] text-[#191f28] hover:bg-[#e5e5ea]'
                                        }`}
                                    >
                                        계속해서 사용하기
                                    </button>
                                </div>
                            </div>

                            {/* 안내 */}
                            <div className="bg-[#fee500]/10 rounded-2xl p-4 border border-[#fee500]/20">
                                <div className="flex items-start gap-3">
                                    <div>
                                        <h4 className="text-[14px] font-semibold text-[#191f28] mb-1">
                                            카카오페이로 간편하게
                                        </h4>
                                        <p className="text-[12px] text-[#8e8e93] leading-relaxed">
                                            카카오톡 ID를 등록하면 멤버들이
                                            카카오페이로 쉽게 송금할 수 있어요.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 하단 버튼 */}
                        <div className="p-6 border-t border-black/[0.06] flex gap-3">
                            {(meetingName?.kakao_deposit_information
                                ?.kakao_deposit_id ||
                                meetingName?.kakaoDepositInformation
                                    ?.kakaoDepositId ||
                                user?.kakaoDepositInformation
                                    ?.kakaoDepositId) && (
                                <button
                                    onClick={handleClear}
                                    disabled={isSaving}
                                    className="flex-1 h-14 bg-[#f2f2f7] text-[#ff3b30] rounded-2xl font-semibold text-[15px] hover:bg-red-50 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    연동 해제
                                </button>
                            )}
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="flex-1 h-14 bg-[#0084ff] text-white rounded-2xl font-bold text-[16px] hover:bg-[#0073e6] transition-all active:scale-[0.98] shadow-lg shadow-[#0084ff]/20 disabled:bg-[#a0c8ff] disabled:cursor-not-allowed"
                            >
                                {isSaving ? '저장 중...' : '저장하기'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {toastPopUp && (
                <ToastPopUp
                    message={toastMessage || '저장이 완료되었어요.'}
                    setToastPopUp={setToastPopUp}
                    type={toastType}
                />
            )}

            {showExplainModal && (
                <div className="fixed inset-0 z-[60] pointer-events-none">
                    <div className="pointer-events-auto">
                        <KakaoIdExplain setModalOpen={setShowExplainModal} />
                    </div>
                </div>
            )}
        </>
    );
};

export default BillingKakaoModal;
