import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { getTripResultByUuid } from '../../api/tripApi';
import { POPULAR_COUNTRIES } from '../../constants/countries';
import { Copy, CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';
import ToastPopUp from '@/components/common/ToastPopUp';
import { sendEventToAmplitude } from '../../utils/amplitude';

const PublicTripPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const uuid = searchParams.get('uuid');
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [paidMap, setPaidMap] = useState({});
    const [openToast, setOpenToast] = useState(false);
    const [tippedModeByMember, setTippedModeByMember] = useState({}); // { [memberId]: boolean }

    const { data, isLoading, error, mutate } = useSWR(
        uuid ? `trip-result-${uuid}` : null,
        () => getTripResultByUuid(uuid),
    );

    // Amplitude 이벤트: 정산 결과 페이지 조회
    useEffect(() => {
        if (data && !isLoading) {
            sendEventToAmplitude('view trip settlement result', {
                uuid: uuid,
                country_code: data.meeting?.country_code || null,
            });
        }
    }, [data, isLoading, uuid]);

    const handleRefresh = async () => {
        await mutate();
    };

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const meeting = data?.meeting || {};
    const publicBudget = data?.public_budget || {};
    const tripCost = data?.trip_cost || {};
    const finalSettlement = data?.final_settlement || [];

    // 총무 정보 계산 (결과 응답 내 user/manager_info/settlement/meeting 정보 우선순위 사용)
    const managerInfo = useMemo(() => {
        const managerFromSettlement = finalSettlement.find(
            (m) => m.is_manager || m.leader || m.is_leader,
        );

        // 0순위: 응답 내 user 정보 (이미 이 페이지에서 함께 내려오는 사용자 정보 사용)
        if (data?.user?.toss_deposit_information) {
            const user = data.user;
            return {
                member_id: user.id,
                name:
                    user.name ||
                    managerFromSettlement?.name ||
                    meeting.manager_name ||
                    '총무',
                bank: user.toss_deposit_information?.bank,
                account: user.toss_deposit_information?.account_number,
                kakao_link: user.kakao_deposit_information?.kakao_deposit_id
                    ? `https://qr.kakaopay.com/${user.kakao_deposit_information.kakao_deposit_id}`
                    : undefined,
                toss_bank: user.toss_deposit_information?.bank,
                toss_account: user.toss_deposit_information?.account_number,
            };
        }

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
            name: managerFromSettlement?.name || meeting.manager_name || '총무',
            bank:
                managerFromSettlement?.bank ||
                meeting.bank_name ||
                managerFromSettlement?.toss_bank,
            account:
                managerFromSettlement?.account_number ||
                meeting.account_number ||
                managerFromSettlement?.toss_account,
            kakao_link: managerFromSettlement?.kakao_link || meeting.kakao_link,
            toss_bank: managerFromSettlement?.toss_bank || meeting.bank_name,
            toss_account:
                managerFromSettlement?.toss_account || meeting.account_number,
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

    // 현재 모드에 맞는 멤버 데이터를 반환하는 헬퍼 함수
    const getMemberData = (member) => {
        const isTipped = tippedModeByMember[member.member_id] || false;

        if (isTipped) {
            return {
                amount:
                    member.settlement_tipped_amount ?? member.settlement_amount,
                depositCopyText:
                    member.tipped_deposit_copy_text ?? member.deposit_copy_text,
                tossLink:
                    member.links?.tipped_toss_deposit_link ??
                    member.links?.toss_deposit_link ??
                    member.links?.toss ??
                    null,
                kakaoLink:
                    member.links?.tipped_kakao_deposit_link ??
                    member.links?.kakao_deposit_link ??
                    member.links?.kakao ??
                    null,
            };
        } else {
            return {
                amount: member.settlement_amount,
                depositCopyText: member.deposit_copy_text,
                tossLink:
                    member.links?.toss_deposit_link ??
                    member.links?.toss ??
                    null,
                kakaoLink:
                    member.links?.kakao_deposit_link ??
                    member.links?.kakao ??
                    null,
            };
        }
    };

    // 멤버별 토글 핸들러
    const toggleMemberTipped = (memberId) => {
        const newValue = !tippedModeByMember[memberId];
        setTippedModeByMember((prev) => ({
            ...prev,
            [memberId]: newValue,
        }));
        // Amplitude 이벤트: 매너 정산 토글
        sendEventToAmplitude('toggle trip tipped mode', {
            uuid: uuid,
            member_id: memberId,
            is_tipped: newValue,
        });
    };

    const handleCopyAccount = async (text) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAccount(true);
            setOpenToast(true);
            // Amplitude 이벤트: 계좌 정보 복사
            sendEventToAmplitude('copy trip account info', {
                uuid: uuid,
            });
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
            const kakaoSdkKey = import.meta.env.VITE_KAKAO_SDK_KEY;
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
        const status = error?.response?.status;
        const isNotFound = status === 404;

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg p-8 max-w-xs w-full">
                    <div className="mb-3">
                        <svg
                            className="w-12 h-12 text-blue-400 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.3}
                            viewBox="0 0 48 48"
                        >
                            <circle
                                cx="24"
                                cy="24"
                                r="22"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="#e0e7ff"
                                opacity="0.5"
                            />
                            <path
                                d="M24 14v7"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            <circle cx="24" cy="32" r="1.8" fill="#2563eb" />
                        </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                        {isNotFound
                            ? '정산 페이지를 찾을 수 없어요'
                            : '데이터를 불러올 수 없습니다.'}
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                        {isNotFound
                            ? '링크가 만료되었거나 잘못된 주소일 수 있어요. 정산을 만든 사람에게 링크를 다시 받아보세요.'
                            : '잠시 후 다시 시도해주세요.'}
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                        {!isNotFound && (
                            <button
                                onClick={handleRefresh}
                                className="w-full px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
                            >
                                다시 시도
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/')}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold bg-white hover:bg-gray-50 transition"
                        >
                            홈으로 가기
                        </button>
                    </div>
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

                {/* 총무 정보 카드 (계좌 복사/송금 버튼 제외) */}
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
                </div>

                {/* 공금 예산 현황 */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        공금 예산 현황
                    </h2>
                    <div className="space-y-3">
                        {/* 총 모은 공금 (초기 + 추가) */}
                        <div>
                            <div className="text-sm text-gray-600 mb-1">
                                총 모은 공금
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatNumber(
                                    (() => {
                                        const initialGonggeum =
                                            publicBudget.initial_gonggeum || 0;
                                        const addedGonggeum =
                                            publicBudget.added_gonggeum || 0;
                                        const exchangeRate =
                                            publicBudget.applied_exchange_rate ||
                                            1;

                                        // added_gonggeum이 있으면 환율을 곱해서 더하고, 없으면 initial_gonggeum만 표시
                                        if (addedGonggeum > 0) {
                                            return Math.round(
                                                initialGonggeum +
                                                    addedGonggeum *
                                                        exchangeRate,
                                            );
                                        } else {
                                            return initialGonggeum;
                                        }
                                    })(),
                                )}
                                원
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                                <span>
                                    🚩 초기{' '}
                                    {formatNumber(
                                        publicBudget.initial_gonggeum || 0,
                                    )}
                                    원
                                </span>
                                {publicBudget.added_gonggeum > 0 && (
                                    <span className="ml-2 text-blue-600 font-medium">
                                        ➕ 추가{' '}
                                        {formatNumber(
                                            Math.round(
                                                publicBudget.added_gonggeum ||
                                                    0,
                                            ),
                                        )}{' '}
                                        {publicBudget.target_currency ||
                                            meeting.target_currency ||
                                            'KRW'}{' '}
                                        (
                                        {formatNumber(
                                            Math.floor(
                                                (publicBudget.added_gonggeum ||
                                                    0) *
                                                    (publicBudget.applied_exchange_rate ||
                                                        meeting.base_exchange_rate ||
                                                        1),
                                            ),
                                        )}
                                        원)
                                    </span>
                                )}
                            </div>
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
                            {publicBudget.remaining_gonggeum_foreign !== null &&
                                publicBudget.remaining_gonggeum_foreign !==
                                    undefined && (
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

                        {/* 실제 총 잔액 강조 */}
                        <div className="pt-3 mt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-900">
                                    실제 총 잔액
                                </span>
                                <span className="text-xl font-bold text-blue-600">
                                    {formatNumber(
                                        Math.floor(
                                            publicBudget.real_total_remaining_krw ||
                                                0,
                                        ),
                                    )}
                                    원
                                </span>
                            </div>
                        </div>

                        {/* 환율 정보 */}
                        {(publicBudget.applied_exchange_rate ||
                            meeting.base_exchange_rate) && (
                            <div className="pt-3 mt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500">
                                        적용 환율
                                    </span>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-gray-700">
                                            1 {meeting.target_currency || 'KRW'}{' '}
                                            ={' '}
                                            {(
                                                publicBudget.applied_exchange_rate ||
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
                                {/* 환율 안내 메시지 */}
                                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <span className="text-amber-600 text-sm flex-shrink-0">
                                            💡
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                                소수점까지 정확히 계산되어
                                                인터넷 환율과 약간 다를 수
                                                있습니다.
                                            </p>
                                        </div>
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
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700">
                                    총 여행 비용
                                </span>
                                <span className="text-xl font-bold text-blue-600">
                                    {formatNumber(
                                        (tripCost.total_public_spent || 0) +
                                            (tripCost.total_individual_spent ||
                                                0),
                                    )}
                                    원
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 정산 대시보드 보러 가기 */}
                {uuid && (
                    <div className="mb-6">
                        <a
                            href={`/meeting/share/trip?uuid=${uuid}`}
                            onClick={() => {
                                sendEventToAmplitude(
                                    'click go to settlement dashboard',
                                    {
                                        uuid: uuid,
                                    },
                                );
                            }}
                            className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
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
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-base">
                                        정산 대시보드 보러 가기
                                    </p>
                                    <p className="text-xs text-blue-100 mt-0.5">
                                        실시간 지출 내역 확인하기
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                )}

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
                                    const memberData = getMemberData(member);
                                    const amount = Math.abs(
                                        memberData.amount || 0,
                                    );
                                    const tossLink =
                                        memberData.tossLink || null;
                                    const kakaoLink =
                                        memberData.kakaoLink ||
                                        managerInfo?.kakao_link;
                                    const isTipped =
                                        tippedModeByMember[member.member_id] ||
                                        false;

                                    return (
                                        <div
                                            key={member.member_id}
                                            className={`border rounded-xl p-4 bg-red-50/40 border-red-100 transition-all ${
                                                isTipped
                                                    ? 'ring-2 ring-blue-200'
                                                    : ''
                                            }`}
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
                                                <span
                                                    className={`text-lg font-bold text-red-600 transition-all ${
                                                        isTipped
                                                            ? 'scale-105'
                                                            : ''
                                                    }`}
                                                >
                                                    {formatNumber(amount)}원
                                                </span>
                                            </div>
                                            {/* 10원 단위 올림 토글 */}
                                            <div className="flex items-center justify-between mb-3 p-2 bg-white/50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs">
                                                        💰
                                                    </span>
                                                    <span className="text-xs text-gray-700 font-medium">
                                                        십원 단위 올림
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        toggleMemberTipped(
                                                            member.member_id,
                                                        )
                                                    }
                                                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                                                        isTipped
                                                            ? 'bg-blue-500'
                                                            : 'bg-gray-200'
                                                    }`}
                                                >
                                                    <div
                                                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                                            isTipped
                                                                ? 'translate-x-6'
                                                                : 'translate-x-0.5'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-600 mb-3">
                                                총무 계좌로 송금해 주세요.
                                            </div>
                                            {/* 모바일에서만 송금/계좌복사 버튼 노출 (PC에서는 숨김) */}
                                            <div className="grid grid-cols-3 gap-2 md:hidden">
                                                <button
                                                    disabled={!tossLink}
                                                    onClick={() => {
                                                        sendEventToAmplitude(
                                                            'click trip toss deposit link',
                                                            {
                                                                uuid: uuid,
                                                                member_id:
                                                                    member.member_id,
                                                                is_tipped:
                                                                    isTipped,
                                                            },
                                                        );
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
                                                    onClick={() => {
                                                        sendEventToAmplitude(
                                                            'click trip kakao deposit link',
                                                            {
                                                                uuid: uuid,
                                                                member_id:
                                                                    member.member_id,
                                                                is_tipped:
                                                                    isTipped,
                                                            },
                                                        );
                                                    }}
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
                                                            memberData.depositCopyText,
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
                                    const memberData = getMemberData(member);
                                    const amount = Math.abs(
                                        memberData.amount || 0,
                                    );
                                    const isTipped =
                                        tippedModeByMember[member.member_id] ||
                                        false;
                                    return (
                                        <div
                                            key={member.member_id}
                                            className={`border rounded-xl p-4 bg-blue-50/40 border-blue-100 transition-all ${
                                                isTipped
                                                    ? 'ring-2 ring-blue-200'
                                                    : ''
                                            }`}
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
                                                        <span
                                                            className={`font-bold transition-all ${
                                                                isTipped
                                                                    ? 'scale-105 text-blue-600'
                                                                    : ''
                                                            }`}
                                                        >
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
