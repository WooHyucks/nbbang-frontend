import React from 'react';
import { Plus } from 'lucide-react';
import { POPULAR_COUNTRIES } from '../../constants/countries';
import AddExpenseModal from './AddExpenseModal';

const TripDashboardLayout = ({
    data,
    viewMode,
    onRefresh,
    onAddExpense,
    showAddExpenseButton = true,
    meetingId,
    members = [],
    countryCode,
    countryCurrency,
    baseExchangeRate,
}) => {
    const [showExpenseModal, setShowExpenseModal] = React.useState(false);
    const [tossModalOpen, setTossModalOpen] = React.useState(false);
    const [kakaoModalOpen, setKakaoModalOpen] = React.useState(false);

    // API 응답 구조에 따라 trip 또는 meeting_info 사용
    const tripData = data.trip || data.meeting_info;
    const budget_summary = data.budget_summary || {};
    const members_status = data.members_status || [];

    const countryInfo =
        countryCode || tripData?.country_code
            ? POPULAR_COUNTRIES.find(
                  (c) => c.code === (countryCode || tripData?.country_code),
              )
            : null;

    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SAFE':
                return 'bg-green-500';
            case 'WARNING':
                return 'bg-yellow-500';
            case 'DANGER':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const handleAddExpenseClick = () => {
        if (onAddExpense) {
            onAddExpense();
        } else {
            setShowExpenseModal(true);
        }
    };

    const handleExpenseSuccess = () => {
        setShowExpenseModal(false);
        if (onRefresh) {
            onRefresh();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            <div className="max-w-md mx-auto px-4 pt-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {tripData?.name || `${countryInfo?.name} 여행`}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{countryInfo?.emoji}</span>
                        <span>{countryInfo?.name}</span>
                    </div>
                </div>

                {/* 예산 배터리 */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-600 mb-2">남은 공금</div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold text-gray-900">
                            {formatNumber(
                                Math.round(
                                    budget_summary.remaining ||
                                        tripData?.remaining_gonggeum_foreign ||
                                        tripData?.remaining_gonggeum ||
                                        0,
                                ),
                            )}
                        </span>
                        <span className="text-xl text-gray-600">
                            {tripData?.currency ||
                                countryInfo?.currency ||
                                'KRW'}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>
                                초기:{' '}
                                {formatNumber(
                                    Math.round(
                                        budget_summary.total_initial ||
                                            tripData?.initial_gonggeum_foreign ||
                                            tripData?.initial_gonggeum ||
                                            1,
                                    ),
                                )}
                            </span>
                            <span>
                                {(budget_summary.percentage || 0).toFixed(1)}%
                                남음
                            </span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${
                                    budget_summary.status === 'DANGER'
                                        ? 'bg-red-500'
                                        : budget_summary.status === 'WARNING'
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                }`}
                                style={{
                                    width: `${Math.min(
                                        budget_summary.percentage || 0,
                                        100,
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* 멤버 정산 카드 */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        멤버별 정산 현황
                    </h2>
                    <div className="space-y-4">
                        {members_status.map((member) => {
                            // API 응답에 따라 id/member_id, name/member_name 처리
                            const memberId = member.id || member.member_id;
                            const memberName =
                                member.name || member.member_name || '';

                            // 멤버별 지분현황 API 구조 처리 (amount, tippedAmount 기반)
                            if (
                                member.amount !== undefined &&
                                member.tippedAmount !== undefined
                            ) {
                                const balance =
                                    member.amount - member.tippedAmount;
                                const direction =
                                    balance < 0
                                        ? 'SEND'
                                        : balance > 0
                                          ? 'RECEIVE'
                                          : 'NONE';
                                const isSend = direction === 'SEND';
                                const isReceive = direction === 'RECEIVE';

                                return (
                                    <div
                                        key={memberId}
                                        className={`border-2 rounded-xl p-4 ${
                                            isSend
                                                ? 'border-red-500 bg-red-50'
                                                : isReceive
                                                  ? 'border-blue-500 bg-blue-50'
                                                  : 'border-gray-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">
                                                    {memberName}
                                                </span>
                                                {member.leader && (
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                                        👑 총무
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">
                                                    낸 금액
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatNumber(
                                                        member.amount,
                                                    )}
                                                    원
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">
                                                    사용 금액
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatNumber(
                                                        member.tippedAmount,
                                                    )}
                                                    원
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t border-gray-200">
                                                {isSend && (
                                                    <div className="text-lg font-bold text-red-600">
                                                        💸{' '}
                                                        {formatNumber(
                                                            Math.abs(balance),
                                                        )}
                                                        원 부족해요!
                                                    </div>
                                                )}
                                                {isReceive && (
                                                    <div className="text-lg font-bold text-blue-600">
                                                        💰{' '}
                                                        {formatNumber(balance)}
                                                        원 돌려받아요!
                                                    </div>
                                                )}
                                                {!isSend && !isReceive && (
                                                    <div className="text-sm text-gray-600">
                                                        정산 완료
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // 기존 API 구조 처리 (current_balance 기반)
                            // direction 필드가 있으면 사용, 없으면 current_balance로 판단
                            const direction =
                                member.direction ||
                                (member.current_balance !== undefined &&
                                member.current_balance < 0
                                    ? 'SEND'
                                    : member.current_balance !== undefined &&
                                        member.current_balance > 0
                                      ? 'RECEIVE'
                                      : 'NONE');
                            const isSend = direction === 'SEND';
                            const isReceive = direction === 'RECEIVE';
                            const hasRemittance =
                                member.remittance?.toss ||
                                member.remittance?.kakao;

                            return (
                                <div
                                    key={memberId}
                                    className={`border-2 rounded-xl p-4 ${
                                        isSend
                                            ? 'border-red-500 bg-red-50'
                                            : isReceive
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">
                                                {memberName}
                                            </span>
                                            {(member.paid_advance || 0) > 0 && (
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                                    ✈️ 선결제함
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* SEND 상태 */}
                                    {isSend && (
                                        <div className="space-y-3">
                                            <div className="text-lg font-bold text-red-600">
                                                💸{' '}
                                                {formatNumber(
                                                    Math.abs(
                                                        member.current_balance,
                                                    ),
                                                )}
                                                원 부족해요!
                                            </div>

                                            {/* 송금 버튼 */}
                                            {hasRemittance &&
                                                viewMode !== 'PUBLIC' && (
                                                    <div className="flex gap-2">
                                                        {member.remittance
                                                            ?.toss && (
                                                            <a
                                                                href={
                                                                    member
                                                                        .remittance
                                                                        .toss
                                                                }
                                                                className="flex-1"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <div className="bg-[#1849fd] border border-[#1849fd] relative w-full h-[63px] rounded-[10px] flex items-center justify-center cursor-pointer">
                                                                    <img
                                                                        className="absolute w-[45px] left-[20px]"
                                                                        alt="toss"
                                                                        src="/images/Toss.png"
                                                                    />
                                                                    <span className="text-xs text-white font-semibold">
                                                                        토스로
                                                                        송금하기
                                                                    </span>
                                                                </div>
                                                            </a>
                                                        )}
                                                        {member.remittance
                                                            ?.kakao && (
                                                            <a
                                                                href={
                                                                    member
                                                                        .remittance
                                                                        .kakao
                                                                }
                                                                className="flex-1"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <div className="bg-[#ffeb3c] border border-[#ffeb3c] relative w-full h-[63px] rounded-[10px] flex items-center justify-center cursor-pointer">
                                                                    <img
                                                                        className="absolute w-[25px] left-[20px]"
                                                                        alt="kakao"
                                                                        src="/images/kakao.png"
                                                                    />
                                                                    <span className="text-xs text-black font-semibold">
                                                                        카카오페이로
                                                                        송금하기
                                                                    </span>
                                                                </div>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {/* RECEIVE 상태 */}
                                    {isReceive && (
                                        <div className="space-y-2">
                                            <div className="text-lg font-bold text-blue-600">
                                                💰{' '}
                                                {formatNumber(
                                                    member.current_balance,
                                                )}
                                                원 돌려받아요!
                                            </div>
                                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                                정산 대기 중
                                            </span>
                                        </div>
                                    )}

                                    {/* 잔액이 0인 경우 */}
                                    {!isSend && !isReceive && (
                                        <div className="text-sm text-gray-600">
                                            정산 완료
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 지출 추가 버튼 (MANAGER 또는 MEMBER 모드에서만) */}
                {showAddExpenseButton &&
                    viewMode !== 'PUBLIC' &&
                    meetingId &&
                    members.length > 0 && (
                        <div className="mb-6">
                            <button
                                onClick={handleAddExpenseClick}
                                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                지출 추가
                            </button>
                        </div>
                    )}
            </div>

            {/* 지출 추가 모달 */}
            {showExpenseModal &&
                meetingId &&
                members.length > 0 &&
                countryCode &&
                countryCurrency &&
                baseExchangeRate && (
                    <AddExpenseModal
                        isOpen={showExpenseModal}
                        onClose={() => setShowExpenseModal(false)}
                        onSuccess={handleExpenseSuccess}
                        meetingId={meetingId}
                        members={members}
                        baseExchangeRate={baseExchangeRate}
                        countryCurrency={countryCurrency}
                        countryCode={countryCode}
                    />
                )}
        </div>
    );
};

export default TripDashboardLayout;
