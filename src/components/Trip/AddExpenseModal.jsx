import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
    createPayment,
    updatePayment,
    getExchangeRate,
} from '../../api/tripApi';
import { formatCurrency } from '../../utils/currencyFormatter';
import { CURRENCY_MAP } from '../../types/trip.js';
import { sendEventToAmplitude } from '../../utils/amplitude';

const AddExpenseModal = ({
    isOpen,
    onClose,
    onSuccess,
    meetingId,
    members,
    baseExchangeRate,
    countryCurrency,
    countryCode,
    initialPayment, // 수정 모드용: 기존 결제 데이터
}) => {
    const [amount, setAmount] = useState('');
    const [place, setPlace] = useState('');
    const [paymentType, setPaymentType] = useState('PUBLIC');
    const [payerId, setPayerId] = useState(null);
    const [customExchangeRate, setCustomExchangeRate] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [selectedCurrency, setSelectedCurrency] = useState(countryCurrency);
    const [date, setDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);
    const [error, setError] = useState('');

    const isKRW = selectedCurrency === 'KRW';
    const isAdvancePayment = paymentType === 'INDIVIDUAL' && isKRW;

    useEffect(() => {
        if (isOpen && members.length > 0) {
            const leader = members.find((m) => m.is_leader) || members[0];
            setPayerId(leader.id);
            // 기본값: 모든 멤버 선택
            setSelectedMemberIds(members.map((m) => m.id));
        }
    }, [isOpen, members]);

    useEffect(() => {
        if (isOpen) {
            if (!members || members.length === 0) {
                setError(
                    '멤버 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.',
                );
                return;
            }

            // 날짜 초기화 (YYYY-MM-DD 형식)
            const today = new Date().toISOString().split('T')[0];

            // 수정 모드: initialPayment가 있으면 기존 데이터로 초기화
            if (initialPayment) {
                setAmount(initialPayment.original_price?.toString() || '');
                setPlace(initialPayment.place || initialPayment.name || '');
                setPaymentType(initialPayment.type || 'PUBLIC');
                // pay_member_id가 0이면 null로 처리 (공금 결제)
                setPayerId(
                    initialPayment.pay_member_id &&
                        initialPayment.pay_member_id !== 0
                        ? initialPayment.pay_member_id
                        : null,
                );
                // [수정] DB에 저장된 통화가 있으면 그걸 우선 사용
                setSelectedCurrency(initialPayment.currency || countryCurrency);
                // attend_member_ids가 배열인지 확인
                setSelectedMemberIds(
                    Array.isArray(initialPayment.attend_member_ids) &&
                        initialPayment.attend_member_ids.length > 0
                        ? initialPayment.attend_member_ids
                        : members.map((m) => m.id),
                );
                // [수정] KRW면 환율 1, 아니면 저장된 환율
                if (initialPayment.currency === 'KRW') {
                    setCustomExchangeRate('1');
                } else {
                    setCustomExchangeRate(
                        initialPayment.exchange_rate?.toString() ||
                            baseExchangeRate?.toString() ||
                            '',
                    );
                }
                // 날짜: created_at이 있으면 사용, 없으면 오늘
                if (initialPayment.created_at) {
                    const paymentDate = new Date(initialPayment.created_at);
                    setDate(paymentDate.toISOString().split('T')[0]);
                } else {
                    setDate(today);
                }
            } else {
                // 추가 모드: 기본값으로 초기화
                setAmount('');
                setPlace('');
                setPaymentType('PUBLIC');
                setPayerId(
                    members.length > 0
                        ? members.find((m) => m.is_leader)?.id || members[0].id
                        : null,
                );
                setSelectedCurrency(countryCurrency);
                setSelectedMemberIds(members.map((m) => m.id));
                setCustomExchangeRate(baseExchangeRate?.toString() || '');
                setDate(today);
            }
            setError('');
        }
    }, [isOpen, members, initialPayment, countryCurrency]);

    // 통화 변경 시 로직 처리
    useEffect(() => {
        // KRW 선택 시 자동으로 개인 결제로 변경
        if (selectedCurrency === 'KRW' && paymentType === 'PUBLIC') {
            setPaymentType('INDIVIDUAL');
        }
    }, [selectedCurrency]);

    // 결제 타입 변경 시 환율 리셋
    useEffect(() => {
        if (paymentType === 'PUBLIC') {
            // 공금 결제로 변경 시 baseExchangeRate로 리셋
            setCustomExchangeRate(baseExchangeRate?.toString() || '');
        } else if (paymentType === 'INDIVIDUAL' && !customExchangeRate) {
            // 개인 결제로 변경 시 값이 없으면 baseExchangeRate로 초기화
            setCustomExchangeRate(baseExchangeRate?.toString() || '');
        }
    }, [paymentType, baseExchangeRate]);

    // 날짜 또는 통화 변경 시 환율 자동 조회 (개인 결제 + 외화인 경우만)
    useEffect(() => {
        const fetchExchangeRate = async () => {
            if (
                paymentType === 'INDIVIDUAL' &&
                selectedCurrency !== 'KRW' &&
                date &&
                selectedCurrency
            ) {
                setIsLoadingExchangeRate(true);
                try {
                    const response = await getExchangeRate(
                        selectedCurrency,
                        date,
                    );
                    if (response?.rate) {
                        setCustomExchangeRate(response.rate.toString());
                    }
                } catch (err) {
                    console.error('환율 조회 실패:', err);
                    // 실패 시 baseExchangeRate 사용
                    setCustomExchangeRate(baseExchangeRate?.toString() || '');
                } finally {
                    setIsLoadingExchangeRate(false);
                }
            }
        };

        fetchExchangeRate();
    }, [date, selectedCurrency, paymentType, baseExchangeRate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!amount || Number(amount) <= 0) {
            setError('금액을 입력해주세요.');
            return;
        }
        if (!place.trim()) {
            setError('장소를 입력해주세요.');
            return;
        }
        if (paymentType === 'INDIVIDUAL' && !payerId) {
            setError('결제자를 선택해주세요.');
            return;
        }
        if (selectedMemberIds.length === 0) {
            setError('참여 멤버를 최소 1명 이상 선택해주세요.');
            return;
        }
        if (
            paymentType === 'INDIVIDUAL' &&
            selectedCurrency !== 'KRW' &&
            !customExchangeRate
        ) {
            setError('환율을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const originalPrice = Number(amount);

            let exchangeRate;
            let price;

            if (paymentType === 'PUBLIC') {
                // 공금 결제: 고정 환율 사용
                exchangeRate = baseExchangeRate;
                price = Math.round(originalPrice / exchangeRate);
            } else {
                if (selectedCurrency === 'KRW') {
                    // 원화 결제: 1:1
                    exchangeRate = 1.0;
                    price = originalPrice;
                } else {
                    // 개인 결제: 사용자가 입력한 환율 사용
                    exchangeRate =
                        Number(customExchangeRate) || baseExchangeRate;
                    price = Math.round(originalPrice / exchangeRate);
                }
            }

            if (!members || members.length === 0) {
                setError('멤버 정보를 불러올 수 없습니다.');
                setIsLoading(false);
                return;
            }

            const paymentData = {
                place: place.trim(),
                name: place.trim(),
                original_price: originalPrice,
                currency: selectedCurrency, // 사용자가 선택한 통화 사용
                // KRW 결제 시 price는 전송하지 않음 (환전 금액 없음)
                price: selectedCurrency === 'KRW' ? null : price,
                type: paymentType,
                payer_id: paymentType === 'PUBLIC' ? null : payerId,
                pay_member_id: paymentType === 'PUBLIC' ? 0 : payerId,
                attend_member_ids: selectedMemberIds,
                exchange_rate: exchangeRate,
                date: date || new Date().toISOString().split('T')[0], // 날짜 전송
            };

            // 수정 모드면 updatePayment, 추가 모드면 createPayment
            if (initialPayment?.id) {
                await updatePayment(meetingId, initialPayment.id, paymentData);
                // Amplitude 이벤트: 지출 수정 완료
                sendEventToAmplitude('complete edit trip expense', {
                    meeting_id: meetingId,
                    payment_type: paymentType,
                    currency: selectedCurrency,
                });
            } else {
                await createPayment(meetingId, paymentData);
                // Amplitude 이벤트: 지출 추가 완료
                sendEventToAmplitude('complete add trip expense', {
                    meeting_id: meetingId,
                    payment_type: paymentType,
                    currency: selectedCurrency,
                });
            }

            if (onSuccess) {
                onSuccess();
            }
            handleClose();
        } catch (err) {
            console.error(
                initialPayment ? '지출 수정 실패:' : '지출 추가 실패:',
                err,
            );
            setError(
                err.response?.data?.message ||
                    (initialPayment
                        ? '지출 수정에 실패했습니다.'
                        : '지출 추가에 실패했습니다.'),
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setPlace('');
        setPaymentType('PUBLIC');
        setPayerId(null);
        setCustomExchangeRate(baseExchangeRate?.toString() || '');
        setSelectedMemberIds([]);
        setSelectedCurrency(countryCurrency);
        setDate(new Date().toISOString().split('T')[0]);
        setError('');
        setIsLoadingExchangeRate(false);
        onClose();
    };

    // 멤버 선택 핸들러
    const handleMemberToggle = (memberId) => {
        setSelectedMemberIds((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId],
        );
    };

    // 전체 선택
    const handleSelectAll = () => {
        setSelectedMemberIds(members.map((m) => m.id));
    };

    // 전체 해제
    const handleDeselectAll = () => {
        setSelectedMemberIds([]);
    };

    // 나만 선택 (현재 로그인한 유저 - 임시로 첫 번째 멤버로 설정)
    const handleSelectMeOnly = () => {
        if (members.length > 0) {
            setSelectedMemberIds([members[0].id]);
        }
    };

    const isAllSelected = selectedMemberIds.length === members.length;
    const isSingleMemberSelected =
        paymentType === 'PUBLIC' && selectedMemberIds.length === 1;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialPayment ? '지출 내역 수정' : '지출 내역 추가'}
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

                    {/* 날짜 선택 필드 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            결제 날짜
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full min-w-0 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            금액
                        </label>
                        <div className="flex gap-2 min-w-0">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={amount}
                                onChange={(e) => {
                                    // 입력에서 숫자만 남기기
                                    const raw = e.target.value.replace(
                                        /[^0-9]/g,
                                        '',
                                    );
                                    setAmount(raw);
                                }}
                                placeholder="0"
                                className="flex-1 min-w-0 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-base font-semibold"
                                required
                            />
                            <select
                                value={selectedCurrency}
                                onChange={(e) => {
                                    setSelectedCurrency(e.target.value);
                                }}
                                className="flex-shrink-0 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-semibold bg-white"
                            >
                                <option value={countryCurrency}>
                                    {countryCurrency}
                                </option>
                                <option value="KRW">🇰🇷 KRW (한국 결제)</option>
                            </select>
                        </div>
                        {selectedCurrency === 'KRW' && (
                            <p className="text-xs text-blue-600 mt-2">
                                💡 선결제/공항 비용으로 입력됩니다. 개인 결제로
                                자동 설정됩니다.
                            </p>
                        )}
                    </div>

                    {/* 적용 환율 입력 필드 (개인 결제 + 외화인 경우만 표시) */}
                    {selectedCurrency !== 'KRW' &&
                        paymentType === 'INDIVIDUAL' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    적용 환율 (1 {selectedCurrency} 당 원화)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={
                                            paymentType === 'PUBLIC'
                                                ? baseExchangeRate?.toFixed(
                                                      2,
                                                  ) || ''
                                                : customExchangeRate
                                                  ? Number(
                                                        customExchangeRate,
                                                    ).toFixed(2)
                                                  : ''
                                        }
                                        disabled={
                                            paymentType === 'PUBLIC' ||
                                            isLoadingExchangeRate
                                        }
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (paymentType !== 'PUBLIC') {
                                                setCustomExchangeRate(value);
                                            }
                                        }}
                                        placeholder={
                                            baseExchangeRate?.toFixed(2) ||
                                            '0.00'
                                        }
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-base font-semibold ${
                                            paymentType === 'PUBLIC' ||
                                            isLoadingExchangeRate
                                                ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                                                : 'bg-white border-gray-200 focus:border-blue-500'
                                        }`}
                                        required={paymentType === 'INDIVIDUAL'}
                                    />
                                    {isLoadingExchangeRate && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                {paymentType === 'INDIVIDUAL' && (
                                    <>
                                        <p className="text-xs text-gray-500 mt-2">
                                            💡 은행/카드사 적용 환율을
                                            입력해주세요
                                        </p>
                                        {isLoadingExchangeRate && (
                                            <p className="text-xs text-blue-500 mt-1">
                                                환율 불러오는 중...
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            장소
                        </label>
                        <input
                            type="text"
                            value={place}
                            onChange={(e) => setPlace(e.target.value)}
                            placeholder="예: 식당"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            결제 수단
                        </label>
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setPaymentType('PUBLIC')}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                    paymentType === 'PUBLIC'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-gray-900">
                                        공금 결제
                                    </span>
                                    {paymentType === 'PUBLIC' && (
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600">
                                    공금 잔액에서 차감됩니다
                                </p>
                                {selectedCurrency !== 'KRW' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        환율: 1 {selectedCurrency} ={' '}
                                        {formatCurrency(
                                            1 / baseExchangeRate,
                                            'KR',
                                        )}
                                        원 (고정)
                                    </p>
                                )}
                                {selectedCurrency === 'KRW' && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                        ⚠️ 공금은 보통 외화로만 사용됩니다. 한국
                                        원화는 개인 결제로 입력해주세요.
                                    </p>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentType('INDIVIDUAL')}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                    paymentType === 'INDIVIDUAL'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-gray-900">
                                        개인 결제
                                    </span>
                                    {paymentType === 'INDIVIDUAL' && (
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        </div>
                                    )}
                                </div>
                                {isAdvancePayment ? (
                                    <p className="text-xs text-gray-600">
                                        공금에서 차감되지 않고, 전체 정산 내역에
                                        포함됩니다.
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-600">
                                        공금에서 차감되지 않고 나중에 정산됩니다
                                    </p>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 참여 멤버 선택 */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-gray-900">
                                누구를 위해 썼나요?
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    전체 선택
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSelectMeOnly}
                                    className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    나만
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {members.map((member) => {
                                const isSelected = selectedMemberIds.includes(
                                    member.id,
                                );
                                return (
                                    <button
                                        key={member.id}
                                        type="button"
                                        onClick={() =>
                                            handleMemberToggle(member.id)
                                        }
                                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`text-sm font-medium ${
                                                    isSelected
                                                        ? 'text-gray-900'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                {member.name}
                                            </span>
                                            {isSelected && (
                                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {isSingleMemberSelected && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-blue-700">
                                    💡 공금에서 차감되지만, 정산 시{' '}
                                    {
                                        members.find((m) =>
                                            selectedMemberIds.includes(m.id),
                                        )?.name
                                    }
                                    님의 지분에서만 전액(독박) 차감됩니다.
                                </p>
                            </div>
                        )}
                    </div>

                    {paymentType === 'INDIVIDUAL' && (
                        <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                            <div>
                                <label className="block text-xs text-gray-600 mb-2">
                                    누가 결제했나요?
                                </label>
                                <select
                                    value={payerId || ''}
                                    onChange={(e) =>
                                        setPayerId(Number(e.target.value))
                                    }
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                    required
                                >
                                    {members.map((member) => (
                                        <option
                                            key={member.id}
                                            value={member.id}
                                        >
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedCurrency !== 'KRW' && baseExchangeRate && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-700 font-semibold mb-1">
                                        💱 실시간 환율 적용
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        당일 환율이 자동으로 적용됩니다
                                    </p>
                                </div>
                            )}

                            {isAdvancePayment && (
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                    <p className="text-xs text-purple-700 font-semibold mb-1">
                                        💳 선결제/준비 비용
                                    </p>
                                    <p className="text-xs text-purple-600">
                                        한국에서 미리 결제한 항공권, 숙박 등이
                                        전체 정산에 포함됩니다.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading
                                ? initialPayment
                                    ? '수정 중...'
                                    : '추가 중...'
                                : initialPayment
                                  ? '수정하기'
                                  : '추가하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddExpenseModal;
