import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { getTripDashboardByUuid } from '../../api/tripApi';
import { POPULAR_COUNTRIES } from '../../constants/countries';
import { RefreshCw, Loader2 } from 'lucide-react';
import ToastPopUp from '@/components/common/ToastPopUp';

const SharedTripPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const uuid = searchParams.get('uuid');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // 대시보드 데이터 조회 (UUID 기반, 인증 불필요)
    // refreshInterval: 3000 (3초마다 자동 갱신)
    const {
        data: dashboardData,
        isLoading,
        error,
        mutate,
    } = useSWR(
        uuid ? `shared-dashboard-${uuid}` : null,
        () => getTripDashboardByUuid(uuid),
        {
            refreshInterval: 3000,
            revalidateOnFocus: true,
        },
    );

    // 국가 정보 찾기
    const countryInfo = dashboardData?.currency
        ? POPULAR_COUNTRIES.find((c) => c.currency === dashboardData.currency)
        : null;

    // 데이터 추출 (API가 주는 값을 그대로 사용)
    const publicWallet = dashboardData?.public_wallet || {};
    const recentPayments = dashboardData?.recent_payments || [];
    const membersWalletStatus = dashboardData?.members_wallet_status || [];
    const myPublicStatus = dashboardData?.my_public_status;

    // 남은 비율 계산 (burn_rate가 있으면 사용, 없으면 간단 계산)
    const remainingPercentage = publicWallet.burn_rate
        ? 100 - publicWallet.burn_rate
        : publicWallet.total_collected_foreign > 0
          ? (publicWallet.remaining_foreign /
                publicWallet.total_collected_foreign) *
            100
          : 0;

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SAFE':
                return 'bg-green-500';
            case 'WARNING':
                return 'bg-yellow-400';
            case 'DANGER':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusEmoji = (status) => {
        switch (status) {
            case 'SAFE':
                return '🟢';
            case 'WARNING':
                return '🟡';
            case 'DANGER':
                return '🔴';
            default:
                return '⚪';
        }
    };

    // 수동 새로고침 함수 (캐시 버스팅)
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const timestamp = Date.now();
            await mutate(() => getTripDashboardByUuid(uuid, timestamp), {
                revalidate: true,
            });
            // 성공 후 토스트 표시
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        } catch (error) {
            console.error('새로고침 실패:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    if (!uuid) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">잘못된 링크입니다.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl"
                    >
                        홈으로
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    if (error || !dashboardData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        데이터를 불러올 수 없습니다.
                    </p>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            <div className="max-w-md mx-auto px-4 pt-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="mb-4 text-gray-600 flex items-center gap-2"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        <span>뒤로</span>
                    </button>
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {countryInfo?.name || '여행'} 대시보드
                        </h1>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                        >
                            {isRefreshing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>최신화 중...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    <span>최신화 하기</span>
                                </>
                            )}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <span>{countryInfo?.emoji || '✈️'}</span>
                        <span>{countryInfo?.name || '해외여행'}</span>
                    </div>
                </div>

                {/* Section A: 우리 공금 현황 */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        우리 공금 현황
                    </h2>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold text-gray-900">
                            {formatNumber(
                                Math.round(publicWallet.remaining_foreign || 0),
                            )}
                        </span>
                        <span className="text-xl text-gray-600">
                            {dashboardData.currency || 'KRW'}
                        </span>
                        <span className="text-lg text-gray-500">남음</span>
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                        총{' '}
                        {formatNumber(
                            Math.round(
                                publicWallet.total_collected_foreign || 0,
                            ),
                        )}{' '}
                        {dashboardData.currency || 'KRW'} 중{' '}
                        {formatNumber(
                            Math.round(publicWallet.total_spent_foreign || 0),
                        )}{' '}
                        {dashboardData.currency || 'KRW'} 사용
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>
                                사용률:{' '}
                                {publicWallet.burn_rate
                                    ? publicWallet.burn_rate.toFixed(1)
                                    : '0.0'}
                                %
                            </span>
                            <span>{remainingPercentage.toFixed(1)}% 남음</span>
                        </div>
                        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${getStatusColor(
                                    publicWallet.status || 'SAFE',
                                )}`}
                                style={{ width: `${remainingPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Section B: 멤버별 공금 잔액 */}
                {membersWalletStatus.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            📊 멤버별 공금 잔액
                        </h2>
                        <div className="space-y-3">
                            {membersWalletStatus.map((member) => {
                                const ratio = member.ratio || 0;
                                const status = member.status || 'SAFE';
                                const currentShare = member.current_share || 0;

                                return (
                                    <div
                                        key={member.member_id}
                                        className="border border-gray-200 rounded-xl p-4 bg-white"
                                    >
                                        {/* 이름과 게이지 바를 한 줄에 */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-lg">
                                                {getStatusEmoji(status)}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {member.name}
                                            </span>
                                            <div className="flex-1 flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${getStatusColor(
                                                            status,
                                                        )}`}
                                                        style={{
                                                            width: `${Math.min(
                                                                ratio,
                                                                100,
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-600 min-w-[35px]">
                                                    {ratio.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* 남은 금액과 경고 메시지 */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatNumber(
                                                    Math.round(currentShare),
                                                )}{' '}
                                                {dashboardData.currency ||
                                                    'KRW'}{' '}
                                                남음
                                            </span>
                                            {status === 'WARNING' && (
                                                <span className="text-xs text-yellow-600">
                                                    ⚠️ 많이 쓰셨네요!
                                                </span>
                                            )}
                                            {status === 'DANGER' && (
                                                <span className="text-xs text-red-600">
                                                    ⚠️ 공금이 부족합니다!
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Section C: 나의 공금 지분 (myPublicStatus가 있는 경우) */}
                {myPublicStatus && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 shadow-sm border border-blue-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            내 공금 현황
                        </h2>
                        <div className="space-y-3">
                            <div className="bg-white rounded-xl p-4 border border-blue-200">
                                <div className="text-sm text-gray-600 mb-2">
                                    초기 지분
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mb-4">
                                    {formatNumber(
                                        Math.round(
                                            myPublicStatus.initial_share || 0,
                                        ),
                                    )}{' '}
                                    {dashboardData.currency || 'KRW'}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">
                                            사용한 금액
                                        </span>
                                        <span className="font-semibold text-gray-900">
                                            {formatNumber(
                                                Math.round(
                                                    myPublicStatus.spent || 0,
                                                ),
                                            )}{' '}
                                            {dashboardData.currency || 'KRW'}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-700">
                                                남은 지분
                                            </span>
                                            <span
                                                className={`text-lg font-bold ${
                                                    myPublicStatus.is_negative
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                }`}
                                            >
                                                {myPublicStatus.is_negative
                                                    ? '-'
                                                    : '+'}
                                                {formatNumber(
                                                    Math.round(
                                                        Math.abs(
                                                            myPublicStatus.remaining ||
                                                                0,
                                                        ),
                                                    ),
                                                )}{' '}
                                                {dashboardData.currency ||
                                                    'KRW'}
                                            </span>
                                        </div>
                                    </div>
                                    {myPublicStatus.is_negative && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="text-xs text-red-700 font-semibold">
                                                부족분:{' '}
                                                {formatNumber(
                                                    Math.round(
                                                        myPublicStatus.deficit_krw ||
                                                            0,
                                                    ),
                                                )}
                                                원
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section D: 최근 지출 내역 */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        최근 지출 내역
                    </h2>
                    <div className="space-y-3">
                        {recentPayments.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                아직 지출이 없습니다.
                            </p>
                        ) : (
                            recentPayments.map((payment) => {
                                const isPublic =
                                    payment.type === 'PUBLIC' ||
                                    payment.is_public === true;
                                const isKRW = payment.currency === 'KRW';

                                // 멤버 정보는 members_wallet_status에서 찾기
                                const payer = membersWalletStatus.find(
                                    (m) =>
                                        m.member_id === payment.pay_member_id,
                                );

                                return (
                                    <div
                                        key={payment.id}
                                        className={`border rounded-xl p-4 ${
                                            isPublic
                                                ? 'border-blue-200 bg-blue-50/30'
                                                : 'border-gray-200 bg-gray-50/30 opacity-70'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {isPublic ? (
                                                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                                                            🟢 공금
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                                                            ⚪ 개인
                                                            {payer?.name
                                                                ? ` - ${payer.name}`
                                                                : ''}
                                                        </span>
                                                    )}
                                                    {/* KRW 뱃지 추가 */}
                                                    {isKRW && (
                                                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                                                            🇰🇷 원화
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    className={`font-semibold text-left mt-4 ${
                                                        isPublic
                                                            ? 'text-gray-900'
                                                            : 'text-gray-600'
                                                    }`}
                                                >
                                                    {payment.place ||
                                                        payment.name}
                                                </div>
                                                {payment.name &&
                                                    payment.place !==
                                                        payment.name && (
                                                        <div className="text-sm text-gray-500 text-left mt-4">
                                                            {payment.name}
                                                        </div>
                                                    )}
                                                {!isPublic && (
                                                    <div className="text-xs text-gray-400 mt-1 text-left">
                                                        (이건 나중에 정산돼요)
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {payment.currency === 'KRW' ? (
                                                    // KRW 결제: price 우선 사용 (개인 결제는 original_price가 null일 수 있음)
                                                    <div
                                                        className={`font-bold ${
                                                            isPublic
                                                                ? 'text-gray-900'
                                                                : 'text-gray-600'
                                                        }`}
                                                    >
                                                        {formatNumber(
                                                            payment.price ||
                                                                payment.original_price ||
                                                                0,
                                                        )}
                                                        원
                                                    </div>
                                                ) : (
                                                    // 외화 결제: 외화 금액 + 환전 금액
                                                    <>
                                                        <div
                                                            className={`font-bold ${
                                                                isPublic
                                                                    ? 'text-gray-900'
                                                                    : 'text-gray-600'
                                                            }`}
                                                        >
                                                            {formatNumber(
                                                                payment.original_price ||
                                                                    0,
                                                            )}{' '}
                                                            {payment.currency ||
                                                                dashboardData.currency}
                                                        </div>
                                                        {payment.price &&
                                                            payment.price >
                                                                0 && (
                                                                <div className="text-xs text-gray-500">
                                                                    ≈{' '}
                                                                    {formatNumber(
                                                                        payment.price,
                                                                    )}
                                                                    원
                                                                </div>
                                                            )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* 토스트 팝업 */}
            {showToast && (
                <ToastPopUp
                    message="최신화가 완료되었어요"
                    setToastPopUp={setShowToast}
                />
            )}
        </div>
    );
};

export default SharedTripPage;
