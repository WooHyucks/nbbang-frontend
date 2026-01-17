import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import {
    getTripDashboard,
    getMembers,
    getTripDetail,
    deletePayment,
} from '../../api/tripApi';
import { POPULAR_COUNTRIES } from '../../constants/countries';
import AddExpenseModal from '../../components/Trip/AddExpenseModal';
import AddBudgetModal from '../../components/Trip/AddBudgetModal';
import ToastPopUp from '../../components/common/ToastPopUp';
import BillingTossModal from '../../components/Modal/BillingTossModal';
import BillingKakaoModal from '../../components/Modal/BillingKakaoModal';
import {
    Plus,
    Copy,
    CheckCircle2,
    RefreshCw,
    Trash2,
    Wallet,
    DollarSign,
} from 'lucide-react'; // 아이콘 추가
import { Skeleton } from '@/components/ui/skeleton';
import { sendEventToAmplitude } from '../../utils/amplitude';

const TripDashboard = () => {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [copiedShareLink, setCopiedShareLink] = useState(false);
    const [copiedResultLink, setCopiedResultLink] = useState(false);
    const [toastPopUp, setToastPopUp] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [showTossModal, setShowTossModal] = useState(false);
    const [showKakaoModal, setShowKakaoModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [isRefreshingPayments, setIsRefreshingPayments] = useState(false);

    // 무한 스크롤을 위한 상태
    const [payments, setPayments] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const paymentsEndRef = useRef(null);

    // 대시보드 데이터 조회 (첫 페이지만)
    const {
        data: dashboardData,
        isLoading,
        error,
        mutate,
        isValidating,
    } = useSWR(meetingId ? `dashboard-${meetingId}` : null, () =>
        getTripDashboard(meetingId, 10, 0),
    );

    // 초기 데이터 로드 시 결제 내역과 페이지네이션 정보 설정
    useEffect(() => {
        if (dashboardData) {
            setPayments(dashboardData.recent_payments || []);
            setPagination(dashboardData.pagination || null);
            // Amplitude 이벤트: 여행 대시보드 조회
            sendEventToAmplitude('view trip dashboard', {
                meeting_id: meetingId,
                currency: dashboardData.currency || 'KRW',
            });
        }
    }, [dashboardData, meetingId]);

    const { data: members = [], mutate: mutateMembers } = useSWR(
        meetingId ? `members-${meetingId}` : null,
        () => getMembers(meetingId),
    );

    const { data: tripInfo, mutate: mutateTripInfo } = useSWR(
        meetingId ? `trip-info-${meetingId}` : null,
        () => getTripDetail(meetingId),
    );

    const countryInfo = dashboardData?.currency
        ? POPULAR_COUNTRIES.find((c) => c.currency === dashboardData.currency)
        : null;

    const publicWallet = dashboardData?.public_wallet || {};
    const membersWalletStatus = dashboardData?.members_wallet_status || [];
    const myPublicStatus = dashboardData?.my_public_status;

    // 다음 페이지 로드 함수
    const loadMorePayments = useCallback(async () => {
        if (isLoadingMore || !pagination?.has_more || !meetingId) {
            return;
        }

        setIsLoadingMore(true);
        try {
            const nextOffset = pagination.offset + pagination.limit;
            const data = await getTripDashboard(meetingId, 10, nextOffset);

            if (data.recent_payments && data.recent_payments.length > 0) {
                setPayments((prev) => [...prev, ...data.recent_payments]);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('결제 내역 로드 실패:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [meetingId, pagination, isLoadingMore]);

    // 스크롤 감지 및 무한 스크롤
    useEffect(() => {
        const handleScroll = () => {
            if (
                !paymentsEndRef.current ||
                isLoadingMore ||
                !pagination?.has_more
            ) {
                return;
            }

            const rect = paymentsEndRef.current.getBoundingClientRect();
            // 뷰포트 하단에 가까워지면 로드 (100px 여유)
            const isNearBottom = rect.top <= window.innerHeight + 100;

            if (isNearBottom) {
                loadMorePayments();
            }
        };

        // 스크롤 이벤트 리스너 추가
        window.addEventListener('scroll', handleScroll, { passive: true });
        // 초기 체크 (이미 하단에 있는 경우)
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMorePayments, isLoadingMore, pagination]);

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

    // 링크 생성 및 공유 핸들러들
    const getSharePageLink = () =>
        tripInfo?.uuid
            ? `${window.location.origin}/meeting/share/trip?uuid=${tripInfo.uuid}`
            : null;
    const getResultPageLink = () =>
        tripInfo?.uuid
            ? `${window.location.origin}/meeting/trip-page?uuid=${tripInfo.uuid}`
            : null;

    const handleCopyShareLink = async () => {
        try {
            const shareLink = getSharePageLink();
            if (shareLink) {
                await navigator.clipboard.writeText(shareLink);
                setCopiedShareLink(true);
                setTimeout(() => setCopiedShareLink(false), 2000);
            }
        } catch (error) {
            console.error('클립보드 복사 실패');
        }
    };

    const handleCopyResultLink = async () => {
        try {
            const resultLink = getResultPageLink();
            if (resultLink) {
                await navigator.clipboard.writeText(resultLink);
                setCopiedResultLink(true);
                setTimeout(() => setCopiedResultLink(false), 2000);
            }
        } catch (error) {
            console.error('클립보드 복사 실패');
        }
    };

    const handleKakaoShareSharePage = () => {
        if (!window.Kakao) {
            alert('카카오톡 공유 기능을 사용할 수 없습니다.');
            return;
        }

        if (!window.Kakao.isInitialized()) {
            const kakaoSdkKey =
                import.meta.env.VITE_KAKAO_SDK_KEY ||
                '904f6d1fcb87f1741d5c8cfad188ffc2';
            window.Kakao.init(kakaoSdkKey);
        }

        const shareLink = getSharePageLink();
        if (!shareLink) return;

        const imageUrl = `${window.location.origin}/kakao_feed.png`;
        const tripName =
            tripInfo?.name || `${countryInfo?.name || '여행'} 여행`;

        window.Kakao.Link.sendDefault({
            objectType: 'feed',
            content: {
                title: 'Nbbang',
                description: `${tripName}의 실시간 여행 대시보드를 확인해보세요!`,
                imageUrl: imageUrl,
                link: {
                    webUrl: shareLink,
                    mobileWebUrl: shareLink,
                },
            },
            buttons: [
                {
                    title: '대시보드 확인하러가기',
                    link: {
                        webUrl: shareLink,
                        mobileWebUrl: shareLink,
                    },
                },
            ],
            installTalk: true,
        });
    };

    const handleKakaoShareResultPage = () => {
        if (!window.Kakao) {
            alert('카카오톡 공유 기능을 사용할 수 없습니다.');
            return;
        }

        if (!window.Kakao.isInitialized()) {
            const kakaoSdkKey =
                import.meta.env.VITE_KAKAO_SDK_KEY ||
                '904f6d1fcb87f1741d5c8cfad188ffc2';
            window.Kakao.init(kakaoSdkKey);
        }

        const resultLink = getResultPageLink();
        if (!resultLink) return;

        const imageUrl = `${window.location.origin}/kakao_feed.png`;
        const tripName =
            tripInfo?.name || `${countryInfo?.name || '여행'} 여행`;

        window.Kakao.Link.sendDefault({
            objectType: 'feed',
            content: {
                title: 'Nbbang',
                description: `${tripName}의 여행 정산 결과를 확인해보세요!`,
                imageUrl: imageUrl,
                link: {
                    webUrl: resultLink,
                    mobileWebUrl: resultLink,
                },
            },
            buttons: [
                {
                    title: '정산 결과 확인하러가기',
                    link: {
                        webUrl: resultLink,
                        mobileWebUrl: resultLink,
                    },
                },
            ],
            installTalk: true,
        });
    };

    // 수동 새로고침
    const handleRefresh = async () => {
        await Promise.all([mutate(), mutateMembers()]);
    };

    // 지출 내역 삭제 핸들러
    const handleDeleteClick = (e, paymentId) => {
        // 부모 div의 클릭 이벤트(모달 열기)가 발생하지 않도록 막기
        e.stopPropagation();
        setPaymentToDelete(paymentId);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!paymentToDelete) return;

        setIsRefreshingPayments(true);
        try {
            await deletePayment(meetingId, paymentToDelete);
            // 첫 페이지만 다시 불러오기
            const data = await getTripDashboard(meetingId, 10, 0);
            setPayments(data.recent_payments || []);
            setPagination(data.pagination || null);
            await Promise.all([mutate(), mutateMembers()]); // 데이터 갱신
            setToastMessage('삭제되었습니다.');
            setToastPopUp(true);
            setShowDeleteModal(false);
            setPaymentToDelete(null);
        } catch (error) {
            console.error('삭제 실패:', error);
            setToastMessage('삭제에 실패했습니다.');
            setToastPopUp(true);
            setShowDeleteModal(false);
            setPaymentToDelete(null);
        } finally {
            setIsRefreshingPayments(false);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setPaymentToDelete(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !dashboardData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center bg-white px-7 py-10 rounded-2xl shadow-lg border border-gray-100 max-w-xs w-full">
                    <div className="mb-4">
                        <svg
                            width={48}
                            height={48}
                            fill="none"
                            viewBox="0 0 48 48"
                        >
                            <circle
                                cx="24"
                                cy="24"
                                r="22"
                                fill="#e0e7ff"
                                opacity="0.45"
                            />
                            <path
                                d="M24 16v8"
                                stroke="#2563eb"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            <circle cx="24" cy="32" r="2.1" fill="#2563eb" />
                        </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mb-1 text-center">
                        데이터를 불러올 수 없습니다
                    </div>
                    <div className="text-gray-400 text-sm text-center mb-6">
                        네트워크 오류 또는 잘못된 접근입니다.
                        <br />
                        잠시 후 다시 시도해 주세요.
                    </div>
                    <button
                        onClick={() => (window.location.href = '/')}
                        className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                    >
                        홈으로 가기
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
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <span>{countryInfo?.emoji || '✈️'}</span>
                        <span>{countryInfo?.name || '해외여행'}</span>
                    </div>
                    {/* 공유 / 입금정보 섹션 */}
                    {tripInfo?.uuid && (
                        <div className="space-y-3 mb-4">
                            {/* 공유 페이지 (실시간 대시보드) */}
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <div className="text-sm font-semibold text-blue-700 mb-3">
                                    📊 실시간 대시보드 공유
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleKakaoShareSharePage}
                                        className="flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FEE500]/90 text-slate-900 px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-semibold flex-1"
                                    >
                                        <img
                                            src="/images/kakao.png"
                                            alt="카카오톡"
                                            className="w-5 h-5"
                                        />
                                        <span>카카오톡</span>
                                    </button>
                                    <button
                                        onClick={handleCopyShareLink}
                                        className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-semibold flex-1"
                                    >
                                        {copiedShareLink ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <Copy className="w-5 h-5" />
                                        )}
                                        <span>
                                            {copiedShareLink
                                                ? '복사됨!'
                                                : '링크 복사'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            {/* 결과 페이지 (정산 결과) */}
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <div className="text-sm font-semibold text-green-700 mb-3">
                                    📋 정산 결과 공유
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleKakaoShareResultPage}
                                        className="flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FEE500]/90 text-slate-900 px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-semibold flex-1"
                                    >
                                        <img
                                            src="/images/kakao.png"
                                            alt="카카오톡"
                                            className="w-5 h-5"
                                        />
                                        <span>카카오톡</span>
                                    </button>
                                    <button
                                        onClick={handleCopyResultLink}
                                        className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-semibold flex-1"
                                    >
                                        {copiedResultLink ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <Copy className="w-5 h-5" />
                                        )}
                                        <span>
                                            {copiedResultLink
                                                ? '복사됨!'
                                                : '링크 복사'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* 입금 정보 설정 (토스 / 카카오) */}
                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                                <div className="text-sm font-semibold text-purple-700 mb-3">
                                    💰 입금 정보 설정
                                </div>
                                <p className="text-xs text-gray-600 mb-3">
                                    정산 페이지에 노출될 토스/카카오 입금 정보를
                                    설정해보세요.
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowTossModal(true)}
                                        className="flex items-center justify-center gap-2 bg-[#0064FF] hover:bg-[#0050CC] text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-semibold flex-1"
                                    >
                                        <Wallet className="w-5 h-5" />
                                        <span>토스 입금정보</span>
                                    </button>
                                    <button
                                        onClick={() => setShowKakaoModal(true)}
                                        className="flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FEE500]/90 text-slate-900 px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-semibold flex-1"
                                    >
                                        <img
                                            src="/images/kakao.png"
                                            alt="카카오페이"
                                            className="w-5 h-5"
                                        />
                                        <span>카카오 입금정보</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section A: 우리 공금 현황 */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">
                            우리 공금 현황
                        </h2>
                        <button
                            onClick={() => {
                                sendEventToAmplitude('click add trip budget', {
                                    meeting_id: meetingId,
                                });
                                setShowBudgetModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                        >
                            <DollarSign size={18} />
                            <span>공금 추가</span>
                        </button>
                    </div>
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
                                            {/* 리더 표시 */}
                                            {(member.is_leader ||
                                                member.leader) && (
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                    👑 총무
                                                </span>
                                            )}
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
                                                {currentShare >= 0 && '남음'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Section D: 최근 지출 내역 (🔥 수정된 부분) */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold text-gray-900">
                            최근 지출 내역
                        </h2>
                        <button
                            onClick={() => {
                                sendEventToAmplitude('click add trip expense', {
                                    meeting_id: meetingId,
                                });
                                setEditingPayment(null);
                                setShowExpenseModal(true);
                            }}
                            className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {isLoading ||
                        (isValidating && payments.length === 0) ||
                        isRefreshingPayments ? (
                            // 스켈레톤 UI
                            Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="border rounded-xl p-4 border-gray-200 bg-gray-50/30"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Skeleton className="h-5 w-16 rounded-full bg-gray-200" />
                                                <Skeleton className="h-5 w-20 rounded-full bg-gray-200" />
                                            </div>
                                            <Skeleton className="h-5 w-32 mb-2 rounded bg-gray-200" />
                                            <Skeleton className="h-4 w-24 rounded bg-gray-200" />
                                        </div>
                                        <div className="text-right">
                                            <Skeleton className="h-6 w-20 mb-2 rounded bg-gray-200" />
                                            <Skeleton className="h-4 w-16 rounded bg-gray-200" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : payments.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                아직 지출이 없습니다.
                            </p>
                        ) : (
                            <>
                                {payments.map((payment) => {
                                    // 공금 여부 체크
                                    const isPublic =
                                        payment.type === 'PUBLIC' ||
                                        payment.is_public === true;
                                    const payer = members.find(
                                        (m) => m.id === payment.pay_member_id,
                                    );

                                    // 🔥 금액 표시 로직 강화 (0원 방지)
                                    // original_price가 없으면 price라도 사용 (Fallback)
                                    const displayAmount =
                                        payment.original_price ??
                                        payment.price ??
                                        0;
                                    const isKRW = payment.currency === 'KRW';

                                    return (
                                        <div
                                            key={payment.id}
                                            onClick={() => {
                                                setEditingPayment(payment);
                                                setShowExpenseModal(true);
                                            }}
                                            className={`border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all relative ${
                                                isPublic
                                                    ? 'border-blue-200 bg-blue-50/30'
                                                    : 'border-gray-200 bg-gray-50/30 opacity-80' // 투명도 조절
                                            }`}
                                        >
                                            {/* 삭제 버튼 */}
                                            <button
                                                onClick={(e) =>
                                                    handleDeleteClick(
                                                        e,
                                                        payment.id,
                                                    )
                                                }
                                                className="absolute bottom-2 right-2 p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all z-10"
                                                title="삭제"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 pr-8">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {isPublic ? (
                                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                                                                🟢 공금
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                                                                ⚪ 개인
                                                                {payer
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
                                                        className={`font-semibold text-left mt-2 ${isPublic ? 'text-gray-900' : 'text-gray-700'}`}
                                                    >
                                                        {payment.place ||
                                                            payment.name}
                                                    </div>
                                                    {/* 설명이 다를 때만 표시 */}
                                                    {payment.name &&
                                                        payment.place !==
                                                            payment.name && (
                                                            <div className="text-sm text-gray-500 text-left">
                                                                {payment.name}
                                                            </div>
                                                        )}
                                                </div>

                                                {/* 금액 표시 섹션 */}
                                                <div className="text-right">
                                                    <div
                                                        className={`font-bold ${isPublic ? 'text-gray-900' : 'text-gray-600'}`}
                                                    >
                                                        {formatNumber(
                                                            displayAmount,
                                                        )}
                                                        {isKRW
                                                            ? ' 원'
                                                            : ` ${payment.currency || dashboardData.currency}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* 무한 스크롤 트리거 */}
                                <div ref={paymentsEndRef} className="h-4" />
                                {/* 로딩 중 표시 */}
                                {isLoadingMore && (
                                    <div className="flex justify-center py-4">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                                            <span className="text-sm">
                                                더 불러오는 중...
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {/* 더 이상 데이터가 없을 때 */}
                                {!pagination?.has_more &&
                                    payments.length > 0 && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                            모든 지출 내역을 불러왔습니다.
                                        </div>
                                    )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {members.length > 0 && (
                <>
                    <AddExpenseModal
                        isOpen={showExpenseModal}
                        onClose={() => {
                            setShowExpenseModal(false);
                            setEditingPayment(null);
                        }}
                        onSuccess={async () => {
                            setIsRefreshingPayments(true);
                            try {
                                // 첫 페이지만 다시 불러오기
                                const data = await getTripDashboard(
                                    meetingId,
                                    10,
                                    0,
                                );
                                setPayments(data.recent_payments || []);
                                setPagination(data.pagination || null);
                                await mutate();
                                await mutateMembers();
                            } finally {
                                setIsRefreshingPayments(false);
                            }
                            setEditingPayment(null);
                        }}
                        meetingId={meetingId}
                        members={members}
                        baseExchangeRate={
                            dashboardData.public_wallet
                                ?.applied_exchange_rate ||
                            dashboardData.public_wallet?.base_exchange_rate ||
                            1
                        }
                        countryCurrency={dashboardData.currency || 'KRW'}
                        countryCode={countryInfo?.code}
                        initialPayment={editingPayment}
                    />
                    <AddBudgetModal
                        isOpen={showBudgetModal}
                        onClose={() => setShowBudgetModal(false)}
                        onSuccess={() => {
                            mutate();
                            mutateMembers();
                            setToastMessage('공금이 추가되었습니다.');
                            setToastPopUp(true);
                        }}
                        meetingId={meetingId}
                        members={members}
                        currency={dashboardData.currency || 'KRW'}
                        baseExchangeRate={
                            dashboardData.public_wallet
                                ?.applied_exchange_rate ||
                            dashboardData.public_wallet?.base_exchange_rate ||
                            1
                        }
                    />
                </>
            )}

            {/* 토스트 팝업 */}
            {toastPopUp && (
                <ToastPopUp
                    message={toastMessage}
                    setToastPopUp={setToastPopUp}
                />
            )}

            {/* 토스 입금정보 모달 */}
            {showTossModal && (
                <BillingTossModal
                    setTossModalOpen={(open) => {
                        setShowTossModal(open);
                        if (!open) {
                            // 모달이 닫힐 때 데이터 갱신
                            mutateTripInfo();
                        }
                    }}
                    meetingName={tripInfo}
                />
            )}

            {/* 카카오 입금정보 모달 */}
            {showKakaoModal && (
                <BillingKakaoModal
                    setKakaoModalOpen={(open) => {
                        setShowKakaoModal(open);
                        if (!open) {
                            // 모달이 닫힐 때 데이터 갱신
                            mutateTripInfo();
                        }
                    }}
                    meetingName={tripInfo}
                />
            )}

            {/* 삭제 확인 모달 */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* 배경 오버레이 */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={handleCancelDelete}
                    />
                    {/* 모달 컨텐츠 */}
                    <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            지출 내역 삭제
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            정말 이 지출 내역을 삭제하시겠습니까?
                            <br />
                            삭제된 내역은 복구할 수 없습니다.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                disabled={isRefreshingPayments}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isRefreshingPayments}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
                            >
                                {isRefreshingPayments ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>삭제 중...</span>
                                    </>
                                ) : (
                                    '삭제'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripDashboard;
