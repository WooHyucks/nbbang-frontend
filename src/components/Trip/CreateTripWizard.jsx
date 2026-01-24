import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { POPULAR_COUNTRIES } from '../../constants/countries';
import { createTripWithContributions } from '../../api/tripApi';
import { useCommonData } from '../../hooks/useCommonData';
import CurrencyFormatter from '../common/CurrencyFormatter';
import { sendEventToAmplitude } from '../../utils/amplitude';

const CreateTripWizard = ({
    isOpen,
    onClose,
    onSuccess,
    existingMembers = [],
}) => {
    const [step, setStep] = useState(1);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [members, setMembers] = useState([]);
    const [newMemberName, setNewMemberName] = useState('');
    const [perPersonAmount, setPerPersonAmount] = useState('');
    const [showIndividualAmounts, setShowIndividualAmounts] = useState(false);
    const [memberContributions, setMemberContributions] = useState({});
    const [totalForeign, setTotalForeign] = useState('');
    const [advancePayments, setAdvancePayments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { countries, getCountryByCode } = useCommonData();

    const isKR = selectedCountry === 'KR';
    const shouldSkipStep3 = isKR;

    useEffect(() => {
        if (isOpen && existingMembers.length > 0) {
            setMembers(existingMembers.map((m) => m.name));
        } else if (isOpen) {
            resetForm();
        }
    }, [isOpen, existingMembers]);

    const resetForm = () => {
        setStep(1);
        setSelectedCountry(null);
        setMembers([]);
        setNewMemberName('');
        setPerPersonAmount('');
        setShowIndividualAmounts(false);
        setMemberContributions({});
        setTotalForeign('');
        setAdvancePayments([]);
        setError('');
    };

    const handleAddMember = () => {
        if (!newMemberName.trim()) {
            setError('멤버 이름을 입력해주세요.');
            return;
        }
        if (members.includes(newMemberName.trim())) {
            setError('이미 추가된 멤버입니다.');
            return;
        }
        const newMember = newMemberName.trim();
        setMembers([...members, newMember]);
        setNewMemberName('');
        setError('');
        
        if (!showIndividualAmounts && perPersonAmount) {
            setMemberContributions({
                ...memberContributions,
                [newMember]: perPersonAmount,
            });
        } else {
            setMemberContributions({
                ...memberContributions,
                [newMember]: '',
            });
        }
    };

    const handleRemoveMember = (name) => {
        setMembers(members.filter((m) => m !== name));
        const newContributions = { ...memberContributions };
        delete newContributions[name];
        setMemberContributions(newContributions);
    };
    
    const handleContributionChange = (memberName, amount) => {
        const numAmount = amount.replace(/[^0-9]/g, '');
        setMemberContributions({
            ...memberContributions,
            [memberName]: numAmount,
        });
    };
    
    useEffect(() => {
        if (!showIndividualAmounts && perPersonAmount && members.length > 0) {
            const newContributions = {};
            members.forEach((member) => {
                newContributions[member] = perPersonAmount;
            });
            setMemberContributions(newContributions);
        }
    }, [perPersonAmount, members.length, showIndividualAmounts]);
    
    useEffect(() => {
        if (showIndividualAmounts) {
            const total = Object.values(memberContributions).reduce(
                (sum, amount) => sum + (Number(amount) || 0),
                0,
            );
            if (total > 0) {
                setPerPersonAmount(total.toString());
            }
        }
    }, [memberContributions, showIndividualAmounts]);

    const handleNext = () => {
        setError('');
        if (step === 1) {
            if (!selectedCountry) {
                setError('여행 국가를 선택해주세요.');
                return;
            }
            // 한국이 아닌 경우 스텝 2로 이동
            setStep(2);
        } else if (step === 2) {
            if (members.length === 0) {
                setError('최소 1명의 멤버가 필요합니다.');
                return;
            }
            if (!perPersonAmount || Number(perPersonAmount) <= 0) {
                setError('1인당 공금 금액을 입력해주세요.');
                return;
            }
            // 한국인 경우 스텝 3을 건너뛰고 스텝 4로 이동
            if (shouldSkipStep3) {
                setStep(4);
            } else {
                setStep(3);
            }
        } else if (step === 3) {
            if (!totalForeign || Number(totalForeign) <= 0) {
                setError('환전받은 외화 금액을 입력해주세요.');
                return;
            }
            setStep(4);
        }
    };

    const handleBack = () => {
        setError('');
        if (step === 4 && shouldSkipStep3) {
            // 한국인 경우 스텝 4에서 뒤로가면 스텝 2로
            setStep(2);
        } else if (step === 3) {
            // 스텝 3에서 뒤로가면 스텝 2로
            setStep(2);
        } else if (step === 2) {
            // 스텝 2에서 뒤로가면 스텝 1로
            setStep(1);
        }
    };

    const handleAddAdvancePayment = () => {
        setAdvancePayments([
            ...advancePayments,
            { name: '', price: 0, pay_member_name: members[0] || '' },
        ]);
    };

    const handleUpdateAdvancePayment = (index, field, value) => {
        const updated = [...advancePayments];
        updated[index] = { ...updated[index], [field]: value };
        setAdvancePayments(updated);
    };

    const handleRemoveAdvancePayment = (index) => {
        setAdvancePayments(advancePayments.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (members.length === 0) {
            setError('최소 1명의 멤버가 필요합니다.');
            return;
        }
        
        if (showIndividualAmounts) {
            const hasEmptyAmount = members.some(
                (member) => !memberContributions[member] || Number(memberContributions[member]) <= 0
            );
            if (hasEmptyAmount) {
                setError('모든 멤버의 공금 금액을 입력해주세요.');
                return;
            }
        } else {
            if (!perPersonAmount || Number(perPersonAmount) <= 0) {
                setError('1인당 공금 금액을 입력해주세요.');
                return;
            }
        }

        setIsLoading(true);
        setError('');

        try {
            const contributions = members.map((name, index) => ({
                member_id: index + 1,
                amount_krw: showIndividualAmounts
                    ? Number(memberContributions[name] || 0)
                    : Number(perPersonAmount),
                member_name: name,
            }));

            const payload = {
                country_code: selectedCountry,
                contributions,
                ...(shouldSkipStep3 ? {} : { total_foreign: Number(totalForeign) }),
                ...(advancePayments.length > 0
                    ? { advance_payments: advancePayments }
                    : {}),
            };

            const response = await createTripWithContributions(payload);

            const location =
                response.headers.location || response.headers.Location;
            let meetingId = null;
            if (location) {
                const match = location.match(/meeting\/(\d+)/);
                if (match) {
                    meetingId = match[1];
                } else {
                    meetingId = location.split('/').pop();
                }
            }

            if (meetingId && onSuccess) {
                // Amplitude 이벤트: 여행 생성 완료
                sendEventToAmplitude('complete create trip', {
                    meeting_id: meetingId,
                    country_code: selectedCountry,
                    member_count: members.length,
                    has_advance_payments: advancePayments.length > 0,
                });
                // onSuccess에서 navigate를 호출하므로, handleClose는 호출하지 않음
                // (페이지 이동으로 자동으로 모달이 닫힘)
                onSuccess(meetingId);
                resetForm();
            } else {
                setError('여행이 생성되었지만 ID를 찾을 수 없습니다.');
                handleClose();
            }
        } catch (err) {
            console.error('여행 생성 실패:', err);
            setError(err.response?.data?.message || '여행 생성에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
    };

    const countryInfo = selectedCountry
        ? getCountryByCode(selectedCountry) ||
          POPULAR_COUNTRIES.find((c) => c.code === selectedCountry)
        : null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {step === 1 && 'Step 1: 여행지 선택'}
                        {step === 2 && 'Step 2: 멤버 및 공금 설정'}
                        {step === 3 && 'Step 3: 환전 정보'}
                        {step === 4 && 'Step 4: 선결제 등록'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-4">
                                어느 나라로 여행가시나요?
                            </label>
                            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCountry('KR')}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        selectedCountry === 'KR'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">🇰🇷</div>
                                    <div className="text-xs font-semibold text-gray-900">
                                        대한민국
                                    </div>
                                </button>
                                {POPULAR_COUNTRIES.map((country) => (
                                    <button
                                        key={country.code}
                                        type="button"
                                        onClick={() =>
                                            setSelectedCountry(country.code)
                                        }
                                        className={`p-4 rounded-xl border-2 transition-all ${
                                            selectedCountry === country.code
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="text-2xl mb-1">
                                            {country.emoji}
                                        </div>
                                        <div className="text-xs font-semibold text-gray-900">
                                            {country.name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                                <label className="block text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="text-lg">👥</span>
                                    멤버 추가
                                </label>
                                {members.length === 0 && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-700 font-medium text-center">
                                            💡 처음 추가하시는 멤버가 총무로 자동 설정됩니다
                                        </p>
                                    </div>
                                )}
                                <div className="flex gap-2 min-w-0">
                                    <input
                                        type="text"
                                        value={newMemberName}
                                        onChange={(e) =>
                                            setNewMemberName(e.target.value)
                                        }
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddMember();
                                            }
                                        }}
                                        placeholder="멤버 이름을 입력하세요"
                                        className="flex-1 min-w-0 px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddMember}
                                        disabled={!newMemberName.trim()}
                                        className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                                    >
                                        추가
                                    </button>
                                </div>
                            </div>

                            {members.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-bold text-gray-900">
                                            멤버 목록 ({members.length}명)
                                        </label>
                                        {members.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowIndividualAmounts(
                                                        !showIndividualAmounts,
                                                    );
                                                    if (!showIndividualAmounts) {
                                                        if (perPersonAmount) {
                                                            const newContributions = {};
                                                            members.forEach((member) => {
                                                                newContributions[member] = perPersonAmount;
                                                            });
                                                            setMemberContributions(newContributions);
                                                        }
                                                    }
                                                }}
                                                className="text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors font-medium"
                                            >
                                                {showIndividualAmounts
                                                    ? '✓ 개별 금액 모드'
                                                    : '💰 개별 금액 입력'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        {members.map((name, index) => (
                                            <div
                                                key={index}
                                                className="group relative flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                    index === 0 
                                                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' 
                                                        : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                                                }`}>
                                                    {index === 0 ? '👑' : index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                        <span className="text-base font-semibold text-gray-900 truncate">
                                                            {name}
                                                        </span>
                                                            {index === 0 && (
                                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                                                    총무
                                                                </span>
                                                            )}
                                                        </div>
                                                        {members.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveMember(
                                                                        name,
                                                                    )
                                                                }
                                                                className="flex-shrink-0 ml-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {showIndividualAmounts && (
                                                        <div className="relative mt-2">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    memberContributions[name]
                                                                        ? formatNumber(
                                                                              memberContributions[name],
                                                                          )
                                                                        : ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleContributionChange(
                                                                        name,
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                placeholder="금액 입력"
                                                                className="w-full px-3 py-2.5 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50 text-gray-900"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                                                                원
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                                <label className="block text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="text-lg">💵</span>
                                    {showIndividualAmounts
                                        ? '총 공금 금액 (KRW)'
                                        : '1인당 얼마씩 걷었나요? (KRW)'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={
                                            perPersonAmount
                                                ? formatNumber(perPersonAmount)
                                                : ''
                                        }
                                        onChange={(e) => {
                                            const value = e.target.value.replace(
                                                /[^0-9]/g,
                                                '',
                                            );
                                            setPerPersonAmount(value);
                                        }}
                                        placeholder="예: 100,000"
                                        className="w-full px-5 py-4 pr-16 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-xl font-bold bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        disabled={showIndividualAmounts}
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base font-semibold text-gray-600">
                                        원
                                    </span>
                                </div>
                                {!showIndividualAmounts &&
                                    perPersonAmount &&
                                    members.length > 0 && (
                                        <div className="mt-3 p-3 bg-white/60 rounded-lg border border-green-200">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 font-medium">
                                                    1인당 금액
                                                </span>
                                                <span className="text-gray-900 font-bold">
                                                    {formatNumber(perPersonAmount)}원
                                                </span>
                                            </div>
                                            {!isKR && (
                                                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-green-200">
                                                    <span className="text-gray-600 font-medium">
                                                        총 공금
                                                    </span>
                                                    <span className="text-green-600 font-bold text-base">
                                                        {formatNumber(
                                                            Number(perPersonAmount) *
                                                                members.length,
                                                        )}
                                                        원
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                {showIndividualAmounts && (
                                    <div className="mt-3 p-3 bg-white/60 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 font-medium">
                                                총 공금
                                            </span>
                                            <span className="text-green-600 font-bold text-lg">
                                                {formatNumber(
                                                    Object.values(
                                                        memberContributions,
                                                    ).reduce(
                                                        (sum, amount) =>
                                                            sum +
                                                            (Number(amount) || 0),
                                                        0,
                                                    ),
                                                )}
                                                원
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && !shouldSkipStep3 && (
                        <div>
                            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-600 mb-1">
                                    총 공금
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {formatNumber(
                                        showIndividualAmounts
                                            ? Object.values(
                                                  memberContributions,
                                              ).reduce(
                                                  (sum, amount) =>
                                                      sum +
                                                      (Number(amount) || 0),
                                                  0,
                                              )
                                            : Number(perPersonAmount) *
                                                  members.length,
                                    )}
                                    원
                                </div>
                            </div>

                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                총 공금을 환전해서 얼마를 받았나요?
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={
                                        totalForeign
                                            ? formatNumber(totalForeign)
                                            : ''
                                    }
                                    onChange={(e) => {
                                        const value = e.target.value.replace(
                                            /[^0-9]/g,
                                            '',
                                        );
                                        setTotalForeign(value);
                                    }}
                                    placeholder="0"
                                    className="w-full px-4 py-3 pr-20 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg font-semibold"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                    {countryInfo?.currency || ''}
                                </span>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    여행 전 미리 결제한 내역(항공권/숙소)이
                                    있나요?
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddAdvancePayment}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                                >
                                    + 선결제 내역 추가
                                </button>
                            </div>

                            {advancePayments.length > 0 && (
                                <div className="space-y-3">
                                    {advancePayments.map((payment, index) => (
                                        <div
                                            key={index}
                                            className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    항목 {index + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveAdvancePayment(
                                                            index,
                                                        )
                                                    }
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">
                                                        항목명
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={payment.name}
                                                        onChange={(e) =>
                                                            handleUpdateAdvancePayment(
                                                                index,
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="예: 항공권"
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">
                                                        금액 (KRW)
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={
                                                                payment.price
                                                                    ? formatNumber(
                                                                          payment.price,
                                                                      )
                                                                    : ''
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target.value.replace(
                                                                        /[^0-9]/g,
                                                                        '',
                                                                    );
                                                                handleUpdateAdvancePayment(
                                                                    index,
                                                                    'price',
                                                                    Number(
                                                                        value,
                                                                    ) || 0,
                                                                );
                                                            }}
                                                            placeholder="0"
                                                            className="w-full px-3 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                                            원
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">
                                                        결제자
                                                    </label>
                                                    <select
                                                        value={
                                                            payment.pay_member_name
                                                        }
                                                        onChange={(e) =>
                                                            handleUpdateAdvancePayment(
                                                                index,
                                                                'pay_member_name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                    >
                                                        {members.map(
                                                            (member) => (
                                                                <option
                                                                    key={
                                                                        member
                                                                    }
                                                                    value={
                                                                        member
                                                                    }
                                                                >
                                                                    {member}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <ChevronLeft size={20} />
                                이전
                            </button>
                        )}
                        {step < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                            >
                                다음
                                <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? '생성 중...' : '여행 시작하기'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTripWizard;


