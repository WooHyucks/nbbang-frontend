import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { POPULAR_COUNTRIES } from '../../constants/countries';
import { createTripWithContributions } from '../../api/tripApi';

const CreateTripModal = ({
    isOpen,
    onClose,
    onSuccess,
    existingMembers = [],
}) => {
    const [step, setStep] = useState(1); // 1: 멤버별 공금 입력, 2: 환전 정보
    const [members, setMembers] = useState([]);
    const [contributions, setContributions] = useState({});
    const [totalKRW, setTotalKRW] = useState('');
    const [showIndividualAmounts, setShowIndividualAmounts] = useState(false); // 개별 금액 입력 모드
    const [newMemberName, setNewMemberName] = useState(''); // 새 멤버 이름 입력

    // 환전 정보
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [totalForeign, setTotalForeign] = useState('');
    const [estimatedRate, setEstimatedRate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && existingMembers.length > 0) {
            // 기존 멤버로 초기화
            const initialMembers = existingMembers.map((m) => ({
                id: m.id,
                name: m.name,
            }));
            setMembers(initialMembers);

            // 1/N 금액은 사용자가 입력하도록 빈 값으로 시작
            const initialContributions = {};
            initialMembers.forEach((member) => {
                initialContributions[member.id] = '';
            });
            setContributions(initialContributions);
        } else if (isOpen) {
            // 새 멤버 추가 모드
            setMembers([]);
            setContributions({});
            setTotalKRW('');
            setShowIndividualAmounts(false);
            setNewMemberName('');
        }
    }, [isOpen, existingMembers]);

    useEffect(() => {
        // 개별 금액 입력 모드가 아닐 때는 Total KRW를 기반으로 1/N 분할
        if (!showIndividualAmounts && totalKRW && members.length > 0) {
            const perPerson = Math.floor(Number(totalKRW) / members.length);
            const newContributions = {};
            members.forEach((member) => {
                newContributions[member.id] = perPerson;
            });
            setContributions(newContributions);
        }
    }, [totalKRW, members.length, showIndividualAmounts]);

    useEffect(() => {
        // 개별 금액 입력 모드일 때는 contributions 합계로 Total KRW 계산
        if (showIndividualAmounts) {
            const total = Object.values(contributions).reduce(
                (sum, amount) => sum + (Number(amount) || 0),
                0,
            );
            setTotalKRW(total.toString());
        }
    }, [contributions, showIndividualAmounts]);

    useEffect(() => {
        // 환율 예상 계산
        if (totalKRW > 0 && totalForeign && selectedCountry) {
            const foreign = Number(totalForeign);
            if (foreign > 0) {
                const rate = foreign / totalKRW; // 1원당 외화
                setEstimatedRate(rate);
            } else {
                setEstimatedRate(null);
            }
        } else {
            setEstimatedRate(null);
        }
    }, [totalKRW, totalForeign, selectedCountry]);

    const handleAddMember = () => {
        if (!newMemberName.trim()) {
            alert('멤버 이름을 입력해주세요.');
            return;
        }

        // 중복 체크
        if (members.some((m) => m.name.trim() === newMemberName.trim())) {
            alert('이미 추가된 멤버입니다.');
            return;
        }

        const newId = Date.now();
        const newMembers = [
            ...members,
            { id: newId, name: newMemberName.trim() },
        ];
        setMembers(newMembers);
        setNewMemberName(''); // 인풋 초기화

        // 개별 금액 입력 모드가 아닐 때는 자동으로 1/N 분할
        if (!showIndividualAmounts && totalKRW) {
            const perPerson = Math.floor(Number(totalKRW) / newMembers.length);
            const newContributions = {};
            newMembers.forEach((member) => {
                newContributions[member.id] = perPerson;
            });
            setContributions(newContributions);
        } else {
            setContributions({ ...contributions, [newId]: 0 });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddMember();
        }
    };

    const handleContributionChange = (id, amount) => {
        const numAmount = amount.replace(/[^0-9]/g, '');
        setContributions({ ...contributions, [id]: numAmount });
    };

    const handleRemoveMember = (id) => {
        const newMembers = members.filter((m) => m.id !== id);
        setMembers(newMembers);

        // 개별 금액 입력 모드가 아닐 때는 자동으로 1/N 분할 재계산
        if (!showIndividualAmounts && totalKRW && newMembers.length > 0) {
            const perPerson = Math.floor(Number(totalKRW) / newMembers.length);
            const newContributions = {};
            newMembers.forEach((member) => {
                newContributions[member.id] = perPerson;
            });
            setContributions(newContributions);
        } else {
            const newContributions = { ...contributions };
            delete newContributions[id];
            setContributions(newContributions);
        }
    };

    const handleNext = () => {
        // Step 1 검증
        if (step === 1) {
            if (members.length === 0) {
                alert('최소 1명의 멤버가 필요합니다.');
                return;
            }
            if (members.some((m) => !m.name.trim())) {
                alert('모든 멤버의 이름을 입력해주세요.');
                return;
            }
            if (!totalKRW || Number(totalKRW) === 0) {
                alert('총 공금 금액을 입력해주세요.');
                return;
            }
            setStep(2);
        }
    };

    const handleSubmit = async () => {
        if (!selectedCountry) {
            alert('여행 국가를 선택해주세요.');
            return;
        }
        if (!totalForeign || Number(totalForeign) <= 0) {
            alert('환전받은 외화 금액을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const contributionsArray = members.map((member) => {
                const amount = showIndividualAmounts
                    ? Number(contributions[member.id] || 0)
                    : Math.floor(Number(totalKRW) / members.length);
                return {
                    member_id: member.id,
                    amount_krw: amount,
                    member_name: member.name,
                };
            });

            const response = await createTripWithContributions({
                contributions: contributionsArray,
                total_foreign: Number(totalForeign),
                country_code: selectedCountry.code,
            });

            const location =
                response.headers.location || response.headers.Location;

            // Location 헤더 파싱: "meeting/1435" 또는 "/meeting/1435" 또는 "http://.../meeting/1435" 형태
            let meetingId = null;
            if (location) {
                // URL 전체인 경우
                if (location.includes('meeting/')) {
                    const match = location.match(/meeting\/(\d+)/);
                    if (match) {
                        meetingId = match[1];
                    } else {
                        // "meeting/1435" 형태
                        meetingId = location
                            .replace(/.*meeting\//, '')
                            .split('/')[0];
                    }
                } else {
                    // 숫자만 있는 경우
                    meetingId = location.split('/').pop();
                }
            }

            if (onSuccess && meetingId) {
                onSuccess(meetingId);
            } else {
                console.error(
                    'meetingId를 찾을 수 없습니다. Location:',
                    location,
                );
                alert(
                    '여행이 생성되었지만 이동할 수 없습니다. Location: ' +
                        location,
                );
            }
            handleClose();
        } catch (error) {
            console.error('여행 생성 실패:', error);
            alert(error.response?.data?.message || '여행 생성에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setMembers([]);
        setContributions({});
        setTotalKRW('');
        setShowIndividualAmounts(false);
        setNewMemberName('');
        setSelectedCountry(null);
        setTotalForeign('');
        setEstimatedRate(null);
        onClose();
    };

    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {step === 1
                            ? 'Step 1: 멤버별 공금 입력'
                            : 'Step 2: 환전 정보'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {step === 1 ? (
                        <>
                            {/* 멤버 추가 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    멤버 추가
                                </label>

                                {/* 첫 번째 멤버 안내 메시지 */}
                                {members.length === 0 && (
                                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                        <p className="text-sm text-blue-700 flex items-center gap-2">
                                            <span className="text-base">
                                                💡
                                            </span>
                                            <span>
                                                처음에 추가되는 멤버가{' '}
                                                <span className="font-semibold">
                                                    👑 총무
                                                </span>
                                                가 됩니다.
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {/* 멤버 입력 필드 */}
                                <div className="flex gap-2 mb-3 min-w-0">
                                    <input
                                        type="text"
                                        value={newMemberName}
                                        onChange={(e) =>
                                            setNewMemberName(e.target.value)
                                        }
                                        onKeyPress={handleKeyPress}
                                        placeholder="멤버 이름 입력"
                                        className="flex-1 min-w-0 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleAddMember}
                                        className="flex-shrink-0 px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                                    >
                                        추가
                                    </button>
                                </div>

                                {/* 멤버 리스트 */}
                                {members.length > 0 && (
                                    <div className="space-y-3 mb-3">
                                        {members.map((member, index) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={member.name}
                                                            onChange={(e) => {
                                                                setMembers(
                                                                    members.map(
                                                                        (m) =>
                                                                            m.id ===
                                                                            member.id
                                                                                ? {
                                                                                      ...m,
                                                                                      name: e
                                                                                          .target
                                                                                          .value,
                                                                                  }
                                                                                : m,
                                                                    ),
                                                                );
                                                            }}
                                                            placeholder="멤버 이름"
                                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                        />
                                                        {/* 첫 번째 멤버는 총무 표시 */}
                                                        {index === 0 && (
                                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1 whitespace-nowrap">
                                                                👑 총무
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* 개별 금액 입력 모드일 때만 금액 입력 표시 */}
                                                    {showIndividualAmounts && (
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    contributions[
                                                                        member
                                                                            .id
                                                                    ]
                                                                        ? formatNumber(
                                                                              contributions[
                                                                                  member
                                                                                      .id
                                                                              ],
                                                                          )
                                                                        : ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleContributionChange(
                                                                        member.id,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="0"
                                                                className="w-full px-3 py-2 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                                                원
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {members.length > 1 && (
                                                    <button
                                                        onClick={() =>
                                                            handleRemoveMember(
                                                                member.id,
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 p-2"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 모으신 돈이 다른가요? 버튼 */}
                            {members.length > 0 && (
                                <div>
                                    <button
                                        onClick={() => {
                                            setShowIndividualAmounts(
                                                !showIndividualAmounts,
                                            );
                                            if (!showIndividualAmounts) {
                                                // 개별 금액 입력 모드로 전환 시 기존 Total KRW를 기반으로 분할
                                                if (totalKRW) {
                                                    const perPerson =
                                                        Math.floor(
                                                            Number(totalKRW) /
                                                                members.length,
                                                        );
                                                    const newContributions = {};
                                                    members.forEach(
                                                        (member) => {
                                                            newContributions[
                                                                member.id
                                                            ] = perPerson;
                                                        },
                                                    );
                                                    setContributions(
                                                        newContributions,
                                                    );
                                                }
                                            }
                                        }}
                                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                                    >
                                        {showIndividualAmounts
                                            ? '모두 같은 금액으로 변경'
                                            : '모으신 돈이 다른가요?'}
                                    </button>
                                </div>
                            )}

                            {/* Total KRW 입력 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    총 공금 금액 (KRW)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={
                                            totalKRW
                                                ? formatNumber(totalKRW)
                                                : ''
                                        }
                                        onChange={(e) => {
                                            const value =
                                                e.target.value.replace(
                                                    /[^0-9]/g,
                                                    '',
                                                );
                                            setTotalKRW(value);
                                        }}
                                        placeholder="예: 1,000,000"
                                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg font-semibold"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                        원
                                    </span>
                                </div>
                                {!showIndividualAmounts &&
                                    totalKRW &&
                                    members.length > 0 && (
                                        <p className="mt-2 text-xs text-gray-500">
                                            1인당{' '}
                                            {formatNumber(
                                                Math.floor(
                                                    Number(totalKRW) /
                                                        members.length,
                                                ),
                                            )}
                                            원
                                        </p>
                                    )}
                            </div>

                            {/* Total KRW 표시 */}
                            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-700">
                                        Total KRW
                                    </span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {formatNumber(totalKRW || 0)}원
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!totalKRW || Number(totalKRW) === 0}
                                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                다음 단계
                            </button>
                        </>
                    ) : (
                        <>
                            {/* 환전 정보 입력 */}
                            <div>
                                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="text-sm text-gray-600 mb-1">
                                        모인 원화 총액
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {formatNumber(totalKRW || 0)}원
                                    </div>
                                </div>

                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    이 돈을 환전해서 얼마를 받았나요?
                                </label>

                                {/* 국가 선택 */}
                                <div className="mb-4">
                                    <label className="block text-xs text-gray-600 mb-2">
                                        여행 국가
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                        {POPULAR_COUNTRIES.map((country) => (
                                            <button
                                                key={country.code}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedCountry(country)
                                                }
                                                className={`p-3 rounded-xl border-2 transition-all ${
                                                    selectedCountry?.code ===
                                                    country.code
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

                                {/* 외화 금액 입력 */}
                                <div className="mb-4">
                                    <label className="block text-xs text-gray-600 mb-2">
                                        받은 외화 금액
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
                                                const value =
                                                    e.target.value.replace(
                                                        /[^0-9]/g,
                                                        '',
                                                    );
                                                setTotalForeign(value);
                                            }}
                                            placeholder="0"
                                            className="w-full px-4 py-3 pr-20 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg font-semibold"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                            {selectedCountry?.currency || ''}
                                        </span>
                                    </div>
                                    {estimatedRate && (
                                        <p className="mt-2 text-xs text-blue-600">
                                            예상 환율: 1원 ={' '}
                                            {estimatedRate.toFixed(6)}{' '}
                                            {selectedCountry?.currency}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    이전
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={
                                        isLoading ||
                                        !selectedCountry ||
                                        !totalForeign
                                    }
                                    className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? '생성 중...' : '여행 시작하기'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateTripModal;
