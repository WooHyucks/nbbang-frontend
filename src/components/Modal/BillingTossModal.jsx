import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
    PatchBillingMeetingTossDeposit,
    PatchBillingUserTossDeposit,
} from '../../api/api';
import { sendEventToAmplitude } from '@/utils/amplitude';
import ToastPopUp from '@/components/common/ToastPopUp';

const banks = [
    'KB국민은행',
    '신한은행',
    '우리은행',
    'NH농협은행',
    '하나은행',
    'IBK기업은행',
    'SC제일은행',
    '한국씨티은행',
    '경남은행',
    '광주은행',
    '대구은행',
    '부산은행',
    '전북은행',
    '제주은행',
    '케이뱅크',
    '카카오뱅크',
    '토스뱅크',
];

const BillingTossModal = ({
    setTossModalOpen,
    meetingName,
    user,
}) => {

    const { meetingId: urlMeetingId } = useParams();
    const meetingId = urlMeetingId || meetingName?.id; // URL에서 가져오거나 meetingName에서 가져오기
    const [accountNumber, setAccountNumber] = useState(
        meetingName?.toss_deposit_information?.account_number ||
            meetingName?.tossDepositInformation?.accountNumber ||
            user?.tossDepositInformation?.accountNumber ||
            '',
    );
    const [selectedBank, setSelectedBank] = useState(
        meetingName?.toss_deposit_information?.bank ||
            meetingName?.tossDepositInformation?.bank ||
            user?.tossDepositInformation?.bank ||
            banks[0],
    );
    const [actionType, setActionType] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [toastPopUp, setToastPopUp] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // 미팅 ID가 없으면 자동으로 "계속해서 사용하기" 모드로 설정
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
        if (!accountNumber.trim() || !selectedBank) {
            setToastMessage('은행과 계좌번호를 모두 입력해주세요.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }

        try {
            setIsSaving(true);
            const formData = {
                account_number: accountNumber.trim(),
                bank: selectedBank,
            };

            if (action === '이번에만 사용하기' && meetingId) {
                const responsePostData = await PatchBillingMeetingTossDeposit(
                    meetingId,
                    formData,
                );
                if (responsePostData && responsePostData.status === 200) {
                    sendEventToAmplitude('complete toss deposit id register', {
                        action: '이번에만 사용하기',
                    });
                    setTossModalOpen(false);
                    setToastMessage('토스 계좌가 설정되었습니다.');
                    setToastType('success');
                    setToastPopUp(true);
                }
            } else if (action === '계속해서 사용하기') {
                await PatchBillingUserTossDeposit(formData);
                if (meetingId) {
                    const responsePostData = await PatchBillingMeetingTossDeposit(
                        meetingId,
                        formData,
                    );
                    if (responsePostData && responsePostData.status === 200) {
                        sendEventToAmplitude('complete toss deposit id register', {
                            action: '계속해서 사용하기',
                        });
                        setTossModalOpen(false);
                        setToastMessage('토스 계좌가 설정되었습니다.');
                        setToastType('success');
                        setToastPopUp(true);
                    }
                } else {
                    // meetingId가 없으면 사용자 정보만 업데이트
                    sendEventToAmplitude('complete toss deposit id register', {
                        action: '계속해서 사용하기',
                    });
                    setTossModalOpen(false);
                    setToastMessage('토스 계좌가 설정되었습니다.');
                    setToastType('success');
                    setToastPopUp(true);
                }
            }
        } catch (error) {
            console.error('Api 데이터 수정 실패', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async () => {
        try {
            const emptyFormData = { account_number: '', bank: '' };
            await PatchBillingUserTossDeposit(emptyFormData);
            if (meetingId) {
                const responsePostData = await PatchBillingMeetingTossDeposit(
                    meetingId,
                    emptyFormData,
                );
                if (responsePostData && responsePostData.status === 200) {
                    setTossModalOpen(false);
                }
            } else {
                setTossModalOpen(false);
            }
        } catch (error) {
            console.error('Api 데이터 수정 실패', error);
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
        <AnimatePresence mode="wait">
            <motion.div
                key="toss-modal-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setTossModalOpen(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white rounded-[28px] w-full max-w-lg mx-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
                >
                    {/* 핸들 바 */}
                    <div className="pt-3 pb-4 px-6 border-b border-black/[0.06] rounded-t-[32px] flex-shrink-0">
                        <div className="w-10 h-1 bg-[#e5e5ea] rounded-full mx-auto mb-4" />
                        <div className="flex items-center justify-between">
                            <h2 className="text-[20px] font-bold text-[#191f28]">
                                토스 계좌 연동
                            </h2>
                            <button
                                onClick={() => setTossModalOpen(false)}
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

                    <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
                        {/* 은행 선택 */}
                        <div>
                            <label className="block text-[13px] font-semibold text-[#191f28] mb-3">
                                은행 선택
                            </label>
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                {banks.map((bank) => (
                                    <button
                                        key={bank}
                                        onClick={() => setSelectedBank(bank)}
                                        className={`
                                            h-12 px-3 rounded-xl text-[13px] font-medium transition-all
                                            ${
                                                selectedBank === bank
                                                    ? 'bg-[#0064ff] text-white shadow-lg shadow-[#0064ff]/20'
                                                    : 'bg-[#f2f2f7] text-[#191f28] hover:bg-[#e5e5ea]'
                                            }
                                        `}
                                    >
                                        {bank || user?.tossDepositInformation?.bank}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 계좌번호 입력 */}
                        <div>
                            <label className="block text-[13px] font-semibold text-[#191f28] mb-2">
                                계좌번호
                            </label>
                            <input
                                type="text"
                                value={accountNumber || user?.tossDepositInformation?.accountNumber}
                                onChange={(e) =>
                                    setAccountNumber(
                                        e.target.value.replace(/[^0-9]/g, ''),
                                    )
                                }
                                placeholder="- 없이 숫자만 입력"
                                className="w-full h-14 px-4 bg-[#f2f2f7] rounded-2xl border-none outline-none text-[15px] placeholder:text-[#c7c7cc] focus:bg-[#e5e5ea] transition-colors"
                                maxLength={20}
                            />
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
                                                ? 'bg-[#0064ff] text-white shadow-lg shadow-[#0064ff]/20'
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
                                                ? 'bg-[#0064ff] text-white shadow-lg shadow-[#0064ff]/20'
                                                : 'bg-[#f2f2f7] text-[#191f28] hover:bg-[#e5e5ea]'
                                        }`}
                                    >
                                        계속해서 사용하기
                                    </button>
                                </div>
                            </div>


                        {/* 안내 */}
                        <div className="bg-[#0064ff]/10 rounded-2xl p-4 border border-[#0064ff]/20">
                            <div className="flex items-start gap-3">
                                <div>
                                    <h4 className="text-[14px] font-semibold text-[#191f28] mb-1">
                                        토스로 빠르게
                                    </h4>
                                    <p className="text-[12px] text-[#8e8e93] leading-relaxed">
                                        토스 계좌를 등록하면 멤버들이 빠르게
                                        송금할 수 있어요. 계좌번호는 마스킹
                                        처리되어 안전합니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 하단 버튼 */}
                    <div className="p-6 border-t border-black/[0.06] flex gap-3 flex-shrink-0">
                        {(meetingName?.toss_deposit_information
                            ?.account_number ||
                            meetingName?.tossDepositInformation
                                ?.accountNumber || user?.tossDepositInformation?.accountNumber) && (
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
            {toastPopUp && (
                <ToastPopUp
                    message={toastMessage || '저장이 완료되었어요.'}
                    setToastPopUp={setToastPopUp}
                    type={toastType}
                />
            )}
        </AnimatePresence>
    );
};

export default BillingTossModal;
