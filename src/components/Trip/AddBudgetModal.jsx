import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { addBudget } from '../../api/tripApi';

const AddBudgetModal = ({
    isOpen,
    onClose,
    onSuccess,
    meetingId,
    members,
    currency,
    baseExchangeRate,
}) => {
    const [amount, setAmount] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // 모달이 열릴 때 모든 멤버를 기본 선택
    useEffect(() => {
        if (isOpen && members.length > 0) {
            setSelectedMemberIds(members.map((m) => m.id));
        }
    }, [isOpen, members]);

    // 모달이 열릴 때 초기화
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setError('');
            if (members.length > 0) {
                setSelectedMemberIds(members.map((m) => m.id));
            }
        }
    }, [isOpen, members]);

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // 입력된 현지 통화 금액
    const foreignAmount = amount ? Number(amount.replace(/[^0-9]/g, '')) : 0;
    
    // 예상 원화 금액 계산
    const estimatedKRW = foreignAmount && baseExchangeRate
        ? Math.round(foreignAmount * baseExchangeRate)
        : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!amount || !amount.trim()) {
            setError('금액을 입력해주세요.');
            return;
        }

        const amountValue = Number(amount.replace(/[^0-9]/g, ''));
        if (amountValue <= 0) {
            setError('올바른 금액을 입력해주세요.');
            return;
        }

        if (selectedMemberIds.length === 0) {
            setError('최소 1명의 멤버를 선택해주세요.');
            return;
        }

        setIsLoading(true);

        try {
            const budgetData = {
                foreignAmount: amountValue,
                memberIds: selectedMemberIds,
            };

            await addBudget(meetingId, budgetData);

            if (onSuccess) {
                onSuccess();
            }
            handleClose();
        } catch (err) {
            console.error('공금 추가 실패:', err);
            setError(
                err.response?.data?.message ||
                    '공금 추가에 실패했습니다. 다시 시도해주세요.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setSelectedMemberIds([]);
        setError('');
        onClose();
    };

    // 멤버 선택 토글
    const handleMemberToggle = (memberId) => {
        setSelectedMemberIds((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId],
        );
    };

    // 전체 선택
    const handleSelectAll = () => {
        if (members.length > 0) {
            setSelectedMemberIds(members.map((m) => m.id));
        }
    };

    // 전체 해제
    const handleDeselectAll = () => {
        setSelectedMemberIds([]);
    };

    const isAllSelected =
        members.length > 0 &&
        selectedMemberIds.length === members.length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        공금 추가하기 (충전)
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                            {error}
                        </p>
                    )}

                    {/* 현지 통화 금액 입력 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            추가할 금액 ({currency || 'KRW'})
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => {
                                    const value = e.target.value.replace(
                                        /[^0-9]/g,
                                    );
                                    setAmount(value);
                                }}
                                placeholder="금액을 입력하세요"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg"
                                required
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                {currency || 'KRW'}
                            </span>
                        </div>
                    </div>

                    {/* 멤버 선택 */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-gray-900">
                                누구 돈으로 충전했나요?
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                                >
                                    전체 선택
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeselectAll}
                                    className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium"
                                >
                                    전체 해제
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3">
                            {members.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    멤버가 없습니다.
                                </p>
                            ) : (
                                members.map((member) => {
                                    const isSelected = selectedMemberIds.includes(
                                        member.id,
                                    );
                                    return (
                                        <label
                                            key={member.id}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() =>
                                                    handleMemberToggle(
                                                        member.id,
                                                    )
                                                }
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {member.name}
                                                </span>
                                                {member.is_leader ||
                                                    (member.leader && (
                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                                            👑 총무
                                                        </span>
                                                    ))}
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 총 금액 요약 */}
                    {foreignAmount > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm font-semibold text-blue-900 text-center">
                                {formatNumber(foreignAmount)}{' '}
                                {currency || 'KRW'}이 공금에 추가됩니다.
                            </p>
                        </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !amount || foreignAmount === 0 || selectedMemberIds.length === 0}
                            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2
                                        size={20}
                                        className="animate-spin"
                                    />
                                    <span>추가 중...</span>
                                </>
                            ) : (
                                '추가하기'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBudgetModal;

