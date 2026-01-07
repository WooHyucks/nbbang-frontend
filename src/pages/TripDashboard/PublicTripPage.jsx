import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { getTripResultByUuid } from '../../api/tripApi';
import { POPULAR_COUNTRIES } from '../../constants/countries';
import { Copy, CheckCircle2, MessageCircle } from 'lucide-react';
import ToastPopUp from '@/components/common/ToastPopUp';

const PublicTripPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const uuid = searchParams.get('uuid');
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [paidMap, setPaidMap] = useState({});
    const [openToast, setOpenToast] = useState(false);

    const { data, isLoading, error, mutate } = useSWR(
        uuid ? `trip-result-${uuid}` : null,
        () => getTripResultByUuid(uuid),
    );

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const meeting = data?.meeting || {};
    const publicBudget = data?.public_budget || {};
    const tripCost = data?.trip_cost || {};
    const finalSettlement = data?.final_settlement || [];

    // 총무 정보 계산 (API 제공 manager_info > settlement 내 leader/manager > meeting의 은행정보)
    const managerInfo = useMemo(() => {
        const managerFromSettlement = finalSettlement.find(
            (m) => m.is_manager || m.leader || m.is_leader,
        );

        // 1순위: API에서 내려주는 manager_info 값을 표준화해서 사용
        if (data?.manager_info) {
            const raw = data.manager_info;
            return {
                member_id: raw.member_id,
                name:
                    raw.name ||
                    managerFromSettlement?.name ||
                    meeting.manager_name ||
                    '총무',
                bank: raw.bank || raw.toss_bank,
                // 표준화된 account 필드
                account:
                    raw.account ||
                    raw.account_number ||
                    managerFromSettlement?.account_number ||
                    meeting.account_number,
                // 카카오 송금 링크 (직접 링크 or ID 기반 QR 링크)
                kakao_link:
                    raw.kakao_link ||
                    raw.kakao_pay_link ||
                    (raw.kakao_deposit_id
                        ? `https://qr.kakaopay.com/${raw.kakao_deposit_id}`
                        : undefined),
                toss_bank: raw.toss_bank || raw.bank,
                toss_account:
                    raw.toss_account ||
                    raw.account_number ||
                    raw.account ||
                    meeting.account_number,
            };
        }

        // 2순위: settlement/meeting 정보로 추론
        return {
            member_id: managerFromSettlement?.member_id,
            name:
                managerFromSettlement?.name ||
                meeting.manager_name ||
                '총무',
            bank:
                managerFromSettlement?.bank ||
                meeting.bank_name ||
                managerFromSettlement?.toss_bank,
            account:
                managerFromSettlement?.account_number ||
                meeting.account_number ||
                managerFromSettlement?.toss_account,
            kakao_link:
                managerFromSettlement?.kakao_link || meeting.kakao_link,
            toss_bank:
                managerFromSettlement?.toss_bank || meeting.bank_name,
            toss_account:
                managerFromSettlement?.toss_account ||
                meeting.account_number,
        };
    }, [data, finalSettlement, meeting]);

    const processSettlement = (list = []) => {
        const sendList = [];
        const receiveList = [];
        const managerIds = new Set();
        if (managerInfo?.member_id) managerIds.add(managerInfo.member_id);
        list.forEach((m) => {
            const isManager =
                managerIds.has(m.member_id) ||
                m.is_manager ||
                m.leader ||
                m.is_leader;
            if (isManager) return;
            if (m.direction === 'SEND') {
                sendList.push(m);
            } else if (m.direction === 'RECEIVE') {
                receiveList.push(m);
            }
        });
        return { sendList, receiveList };
    };

    const { sendList, receiveList } = processSettlement(finalSettlement);

    const handleCopyAccount = async (text) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAccount(true);
            setOpenToast(true);
            setTimeout(() => setCopiedAccount(false), 1500);
        } catch (err) {
            console.error('계좌 복사 실패', err);
        }
    };

    const handleCopyLink = async () => {
        try {
            const shareLink = window.location.href;
            await navigator.clipboard.writeText(shareLink);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (error) {
            console.error('클립보드 복사 실패');
        }
    };

    // 카카오 공유
    const handleKakaoShare = (meeting, countryInfo) => {
        // 카카오 SDK 초기화
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

        const shareLink = window.location.href;
        const imageUrl = `${window.location.origin}/kakao_feed.png`;
        const tripName = meeting?.name || `${countryInfo?.name || '여행'} 여행`;

        window.Kakao.Link.sendDefault({
            objectType: 'feed',
            content: {
                title: 'Nbbang',
                description: `${tripName}의 여행 정산 결과입니다.`,
                imageUrl: imageUrl,
                link: {
                    webUrl: shareLink,
                    mobileWebUrl: shareLink,
                },
            },
            buttons: [
                {
                    title: '정산 결과 확인하러가기',
                    link: {
                        webUrl: shareLink,
                        mobileWebUrl: shareLink,
                    },
                },
            ],
            installTalk: true,
        });
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

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        데이터를 불러올 수 없습니다.
                    </p>
                    <button
                        onClick={() => mutate()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    const countryInfo = meeting.country_code
        ? POPULAR_COUNTRIES.find((c) => c.code === meeting.country_code)
        : null;

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
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {meeting.name || `${countryInfo?.name} 여행`} 정산 결과
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <span>{countryInfo?.emoji || '✈️'}</span>
                        <span>{countryInfo?.name || '해외여행'}</span>
                    </div>
                </div>

                {/* 총무 정보 카드 */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            👑 총무 정보
                        </h2>
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full">
                            {managerInfo?.name || '총무'}
                        </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">이름</span>
                            <span className="font-semibold">
                                {managerInfo?.name || '-'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">은행</span>
                            <span className="font-semibold">
                                {managerInfo?.bank ||
                                    managerInfo?.toss_bank ||
                                    '-'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">계좌번호</span>
                            <span className="font-semibold">
                                {managerInfo?.account ||
                                    managerInfo?.account_number ||
                                    managerInfo?.toss_account ||
                                    '-'}
                            </span>
                        </div>
                    </div>
                    {/* 모바일에서만 송금/계좌복사 버튼 노출 (PC에서는 숨김) */}
                    <div className="mt-4 flex gap-2 md:hidden">
                        <button
                            onClick={() =>
                                handleCopyAccount(
                                    // deposit_copy_text(또는 depositCopyText)가 있으면 우선 사용
                                    data?.manager_info?.depositCopyText ||
                                        data?.manager_info?.deposit_copy_text ||
                                        managerInfo?.account ||
                                        managerInfo?.account_number ||
                                        managerInfo?.toss_account,
                                )
                            }
                            className="flex-1 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {copiedAccount ? '복사됨!' : '계좌 복사'}
                        </button>
                        {managerInfo?.kakao_link && (
                            <a
                                href={managerInfo.kakao_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-4 py-2 text-sm font-semibold text-slate-900 bg-[#FEE500] rounded-lg hover:bg-[#FEE500]/90 transition-colors text-center"
                            >
                                카카오 송금
                            </a>
                        )}
                    </div>
                </div>

                {/* 공금 예산 현황 */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        공금 예산 현황
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                초기 공금
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                                {formatNumber(
                                    publicBudget.initial_gonggeum || 0,
                                )}
                                원
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                공금 사용액
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                                {formatNumber(
                                    publicBudget.total_public_spent || 0,
                                )}
                                원
                            </span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700">
                                    남은 공금
                                </span>
                                <span className="text-xl font-bold text-green-600">
                                    {formatNumber(
                                        publicBudget.remaining_gonggeum_krw ||
                                            0,
                                    )}
                                    원
                                </span>
                            </div>
                            {publicBudget.remaining_gonggeum_foreign && (
                                <div className="text-xs text-gray-500 mt-1 text-right">
                                    (
                                    {formatNumber(
                                        Math.round(
                                            publicBudget.remaining_gonggeum_foreign,
                                        ),
                                    )}{' '}
                                    {meeting.target_currency || 'KRW'})
                                </div>
                            )}
                        </div>
                        {/* 환율 정보 */}
                        {(publicBudget.applied_exchange_rate ||
                            meeting.base_exchange_rate) && (
                            <div className="pt-3 mt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        적용 환율
                                    </span>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-gray-700">
                                            1{' '}
                                            {meeting.target_currency || 'KRW'} ={' '}
                                            {(
                                                publicBudget
                                                    .applied_exchange_rate ||
                                                    meeting.base_exchange_rate ||
                                                    0
                                            ).toFixed(2)}
                                            원
                                        </span>
                                        {publicBudget.exchange_rate_date && (
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                (
                                                {publicBudget.exchange_rate_date.replace(
                                                    /(\d{4})-(\d{2})-(\d{2})/,
                                                    '$1년 $2월 $3일',
                                                )}
                                                기준)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 여행 비용 요약 */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        여행 비용 요약
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                공금 사용액
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                                {formatNumber(tripCost.total_public_spent || 0)}
                                원
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                개인 지출액
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                                {formatNumber(
                                    tripCost.total_individual_spent || 0,
                                )}
                                원
                            </span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">
                                    총 여행 비용
                                </span>
                                <span className="text-xl font-bold text-blue-600">
                                    {formatNumber(
                                        tripCost.grand_total_cost || 0,
                                    )}
                                    원
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    1인당 비용
                                </span>
                                <span className="text-sm font-semibold text-gray-700">
                                    {formatNumber(
                                        tripCost.per_person_cost || 0,
                                    )}
                                    원
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 총무 중심 정산 리스트 */}
                <div className="space-y-5">
                    {/* Section A: 총무에게 보내주세요 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">
                            💸 총무에게 보내주세요
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            총무에게 입금해야 하는 멤버 리스트입니다.
                        </p>
                        {sendList.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                송금할 멤버가 없습니다.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {sendList.map((member) => {
                                    const amount = Math.abs(
                                        member.settlement_amount || 0,
                                    );
                                    // 백엔드에서 내려주는 토스/카카오 링크를 우선 사용
                                    const tossLink = member.links?.toss || null;
                                    const kakaoLink =
                                        member.links?.kakao ||
                                        managerInfo?.kakao_link;

                                    return (
                                        <div
                                            key={member.member_id}
                                            className="border rounded-xl p-4 bg-red-50/40 border-red-100"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900">
                                                        {member.name}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                                                        보내야 함
                                                    </span>
                                                </div>
                                                <span className="text-lg font-bold text-red-600">
                                                    {formatNumber(amount)}원
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 mb-3">
                                                총무 계좌로 송금해 주세요.
                                            </div>
                                            {/* 모바일에서만 송금/계좌복사 버튼 노출 (PC에서는 숨김) */}
                                            <div className="grid grid-cols-3 gap-2 md:hidden">
                                                <button
                                                    disabled={!tossLink}
                                                    onClick={() => {
                                                        if (tossLink)
                                                            window.location.href =
                                                                tossLink;
                                                    }}
                                                    className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                                                        tossLink
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Toss 송금
                                                </button>
                                                <a
                                                    href={kakaoLink || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`px-3 py-2 rounded-lg text-sm font-semibold text-center ${
                                                        kakaoLink
                                                            ? 'bg-[#FEE500] text-slate-900 hover:bg-[#FEE500]/90'
                                                            : 'bg-gray-100 text-gray-400 pointer-events-none'
                                                    }`}
                                                >
                                                    카카오 송금
                                                </a>
                                                <button
                                                    onClick={() =>
                                                        handleCopyAccount(
                                                            member
                                                                ?.depositCopyText ||
                                                                member?.deposit_copy_text ||
                                                                account,
                                                        )
                                                    }
                                                    className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50"
                                                >
                                                    계좌 복사
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Section B: 총무가 보내드립니다 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">
                            💰 총무가 보내드립니다
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            총무가 환급해야 하는 멤버 리스트입니다.
                        </p>
                        {receiveList.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                환급할 멤버가 없습니다.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {receiveList.map((member) => {
                                    const amount = Math.abs(
                                        member.settlement_amount || 0,
                                    );
                                    return (
                                        <div
                                            key={member.member_id}
                                            className="border rounded-xl p-4 bg-blue-50/40 border-blue-100"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-gray-900">
                                                            {member.name}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                                                            받을 금액
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700">
                                                        총무님이 {member.name}
                                                        님에게{' '}
                                                        <span className="font-bold">
                                                            {formatNumber(
                                                                amount,
                                                            )}
                                                            원
                                                        </span>{' '}
                                                        을 보내야 합니다.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {openToast && (
                <ToastPopUp
                    setToastPopUp={setOpenToast}
                    message={'계좌복사 완료'}
                />
            )}
        </div>
    );
};

export default PublicTripPage;
