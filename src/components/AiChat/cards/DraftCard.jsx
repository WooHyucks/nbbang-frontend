import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Copy, Edit } from 'lucide-react';
import { createAiMeeting } from '../../../api/api';
import BillingTossModal from '../../Modal/BillingTossModal';
import BillingKakaoModal from '../../Modal/BillingKakaoModal';
import { sendEventToAmplitude } from '@/utils/amplitude';
import DraftEditModal from './DraftEditModal';
import ToastPopUp from '../../common/ToastPopUp';

const DraftCard = ({
    aiData,
    imageUrls = [],
    onConfirm,
    isViewerMode = false,
    onSettlementCreated,
    uuid,
    settlementMembers = [],
    meetingId,
    user = null,
    onUserUpdate = null,
}) => {
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editedData, setEditedData] = useState(aiData);
    const [toastPopUp, setToastPopUp] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [tippedModeByMember, setTippedModeByMember] = useState({}); // { [memberId]: boolean }
    const [showTossModal, setShowTossModal] = useState(false);
    const [showKakaoModal, setShowKakaoModal] = useState(false);

    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
    };

    // 현재 모드에 맞는 멤버 데이터를 반환하는 헬퍼 함수
    const getMemberData = (member) => {
        // member_id가 없으면 name을 키로 사용
        const memberKey = member.member_id || member.name;
        const isTipped = tippedModeByMember[memberKey] || false;

        if (isTipped) {
            return {
                amount:
                    member.tipped_amount ??
                    member.settlement_tipped_amount ??
                    member.settlement_amount ??
                    member.amount,
                depositCopyText:
                    member.tipped_deposit_copy_text ?? member.deposit_copy_text,
                tossLink:
                    member.tipped_toss_deposit_link ??
                    member.toss_deposit_link ??
                    null,
                kakaoLink:
                    member.tipped_kakao_deposit_link ??
                    member.kakao_deposit_link ??
                    null,
            };
        } else {
            return {
                amount: member.amount ?? member.settlement_amount,
                depositCopyText: member.deposit_copy_text,
                tossLink: member.toss_deposit_link ?? null,
                kakaoLink: member.kakao_deposit_link ?? null,
            };
        }
    };

    // 멤버별 토글 핸들러
    const toggleMemberTipped = (memberKey) => {
        const newValue = !tippedModeByMember[memberKey];
        setTippedModeByMember((prev) => ({
            ...prev,
            [memberKey]: newValue,
        }));
        // Amplitude 이벤트: 매너 정산 토글
        sendEventToAmplitude('toggle ai settlement tipped mode', {
            uuid: uuid,
            member_key: memberKey,
            is_tipped: newValue,
        });
    };

    // 총액 계산
    const totalAmount = editedData?.items?.reduce(
        (sum, item) => sum + (item.price || 0),
        0
    ) || 0;

    // 사용자 계좌/카카오 설정 여부
    const userHasToss =
        user?.toss_deposit_information?.account_number ||
        user?.tossDepositInformation?.accountNumber;
    const userHasKakao =
        user?.kakao_deposit_information?.kakao_deposit_id ||
        user?.kakaoDepositInformation?.kakaoDepositId;
    
    // 토스 계좌 정보
    const tossBank = user?.toss_deposit_information?.bank || user?.tossDepositInformation?.bank || '';
    const tossAccount = user?.toss_deposit_information?.account_number || user?.tossDepositInformation?.accountNumber || '';
    const tossDisplayText = userHasToss && tossBank && tossAccount 
        ? `${tossBank} ${tossAccount}` 
        : '토스 계좌 설정/수정';
    
    // 카카오 아이디
    const kakaoId = user?.kakao_deposit_information?.kakao_deposit_id || user?.kakaoDepositInformation?.kakaoDepositId || '';
    const kakaoDisplayText = userHasKakao && kakaoId 
        ? kakaoId 
        : '카카오페이 설정/수정';

  

    // 첫 번째 이미지를 배경으로 사용
    const backgroundImage = imageUrls?.[0] || '';

    // 정산 결과 생성 및 링크 복사
    const handleCreateAndCopyLink = async () => {
        if (isCreating) return;

        setIsCreating(true);
        try {
            // items의 총 가격 계산
            const totalPrice = editedData.items?.reduce(
                (sum, item) => sum + (item.price || 0),
                0
            ) || 0;

            // AI 데이터를 API 스펙에 맞게 변환
            const payload = {
                name: editedData.meeting_name || 'AI 정산',
                date: editedData.date || new Date().toISOString().split('T')[0],
                type: 'AI',
                payments: [
                    {
                        name: editedData.meeting_name || 'AI 정산',
                        price: totalPrice,
                        items: editedData.items?.map((item) => ({
                            name: item.name || '항목',
                            price: item.price || 0,
                            quantity: 1,
                            attendees: item.attendees || [],
                        })) || [],
                        imageUrls: imageUrls || [],
                    },
                ],
            };

            // AI 정산 생성 API 호출
            const result = await createAiMeeting(payload);
            
            if (result && result.id) {
                const meetingId = result.id;
                const resultUuid = result.uuid; // 생성 응답에서 uuid 가져오기
                
                // uuid가 있으면 바로 링크 생성 및 복사
                if (resultUuid) {
                    const baseLink = `${window.location.origin}/share?ai=${resultUuid}`;
                    const shareLink = `${baseLink}&v=${Date.now()}`;
                    
                    // 링크 복사
                    await navigator.clipboard.writeText(shareLink);
                    setToastPopUp(true);
                }
                
                // Amplitude 이벤트
                sendEventToAmplitude('create ai settlement and copy link', {
                    meeting_name: editedData?.meeting_name,
                    total_amount: totalAmount,
                });
                
                // 정산 생성 성공 시 콜백 호출 (사이드바 리프레시용)
                if (onSettlementCreated) {
                    onSettlementCreated(meetingId);
                }
            } else {
                throw new Error('정산 생성 응답에 ID가 없습니다.');
            }
        } catch (error) {
            console.error('정산 생성 실패:', error);
            setToastMessage('정산 생성에 실패했습니다. 다시 시도해주세요.');
            setToastType('error');
            setToastPopUp(true);
        } finally {
            setIsCreating(false);
        }
    };

    // 링크 복사
    const handleCopyLink = async () => {
        if (!uuid) {
            // uuid가 없으면 먼저 정산 생성
            await handleCreateAndCopyLink();
            return;
        }

        try {
            // 현재 도메인 + /share?ai={uuid} 형식으로 링크 생성
            const baseLink = `${window.location.origin}/share?ai=${uuid}`;
            const shareLink = `${baseLink}&v=${Date.now()}`;
            
            await navigator.clipboard.writeText(shareLink);
            setToastMessage('정산 결과 링크가 복사되었습니다.');
            setToastType('success');
            setToastPopUp(true);
            
            sendEventToAmplitude('copy ai settlement link', {
                meeting_name: editedData?.meeting_name,
            });
        } catch (error) {
            console.error('링크 복사 실패:', error);
            setToastMessage('링크 복사에 실패했습니다.');
            setToastType('error');
            setToastPopUp(true);
        }
    };

    // 수정하기
    const handleEdit = () => {
        setShowEditModal(true);
    };

    // 수정 완료
    const handleEditComplete = async (updatedData) => {
        setEditedData(updatedData);
        setShowEditModal(false);
        
        sendEventToAmplitude('edit ai settlement draft', {
            meeting_name: updatedData?.meeting_name,
        });

        // meetingId가 있으면 부모 컴포넌트에 수정 완료 알림 (데이터 재로드용)
        // ChatContainer의 useEffect가 meetingId를 감지하여 자동으로 재로드함
        if (meetingId && onSettlementCreated) {
            // 재로드를 트리거하기 위해 meetingId를 다시 전달
            // 실제로는 ChatContainer의 useEffect가 자동으로 처리
        }
    };

    return (
        <>
            <div className="w-full">
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* 이미지 배경 */}
                    {backgroundImage && (
                        <div
                            className="w-full h-48 bg-cover bg-center relative"
                            style={{
                                backgroundImage: `url(${backgroundImage})`,
                            }}
                        >
                            {/* 그라데이션 오버레이 */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
                        </div>
                    )}

                    <div className="p-4">
                        {/* 헤더 */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles
                                    size={16}
                                    className="text-[#3182F6] flex-shrink-0"
                                />
                                <h3 className="font-bold text-gray-900 text-base">
                                    {editedData?.meeting_name || '정산 내역'}
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500 ml-6">
                                {editedData?.date || ''}
                            </p>
                        </div>

                        {/* 송금정보 설정 CTA (AI 결과 뷰 모드에서는 숨김) */}
                        {!isViewerMode && (
                            <div className="mb-4 p-4 rounded-2xl border border-dashed border-[#3182F6]/30 bg-[#f5f8ff] flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <Sparkles size={18} className="text-[#3182F6]" />
                                    </div>
                                    <div className="flex-1 text-sm text-[#1f2937] leading-relaxed">
                                        송금 정보를 등록하거나 수정해서 멤버들이 빠르게 보낼 수 있게 해주세요.
                                        <div className="mt-2 text-xs text-gray-500">
                                            현재 상태: 토스 {userHasToss ? '등록됨' : '미등록'} / 카카오 {userHasKakao ? '등록됨' : '미등록'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        onClick={() => setShowTossModal(true)}
                                        className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold bg-[#1350fe] text-white rounded-xl md:hover:bg-[#0d3fc7] active:scale-95 active:bg-[#0d3fc7] transition-all shadow-sm flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                                    >
                                        <img src="/images/result_toss.png" alt="toss" className="w-4 h-4" />
                                        <span className="truncate max-w-[200px]">{tossDisplayText}</span>
                                    </button>
                                    <button
                                        onClick={() => setShowKakaoModal(true)}
                                        className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold bg-[#fee500] text-[#191f28] rounded-xl md:hover:bg-[#fdd835] active:scale-95 active:bg-[#fdd835] transition-all shadow-sm flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                                    >
                                        <img src="/images/kakao 2.png" alt="kakao" className="w-4 h-4" />
                                        <span className="truncate max-w-[200px]">{kakaoDisplayText}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 멤버 목록 */}
                        {editedData?.members && editedData.members.length > 0 && (
                            <div className="mb-4 pb-4 border-b border-gray-100">
                                <p className="text-xs text-gray-500 mb-2">참여자</p>
                                <div className="flex flex-wrap gap-2">
                                    {editedData.members.map((member, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs"
                                        >
                                            {member}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 아이템 리스트 */}
                        {editedData?.items && editedData.items.length > 0 && (
                            <div className="mb-4 pb-4 border-b border-gray-100">
                                <p className="text-xs text-gray-500 mb-2">항목</p>
                                <div className="space-y-2">
                                    {editedData.items.map((item, index) => (
                                        <div
                                            key={`item-${index}-${item.name}`}
                                            className="flex items-start justify-between p-2 rounded-lg md:hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {item.name || '항목'}
                                                </p>
                                                <div className="mt-1 space-y-0.5">
                                                    {item.attendees &&
                                                        item.attendees.length > 0 && (
                                                            <p className="text-xs text-gray-500">
                                                                ({item.attendees.join(', ')})
                                                            </p>
                                                        )}
                                                    {(item.payer || item.pay_member || item.paid_by) && (
                                                        <p className="text-xs text-blue-600 font-medium">
                                                            결제: {item.payer || item.pay_member || item.paid_by}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 ml-4 flex-shrink-0">
                                                {formatNumber(item.price || 0)}원
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 총액 */}
                        <div className="mb-4 pb-4 border-b border-gray-100">
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm text-gray-600">
                                    총 정산 금액
                                </span>
                                <span className="text-2xl font-bold text-gray-900">
                                    {formatNumber(totalAmount)}원
                                </span>
                            </div>
                        </div>

                        {/* 정산 결과 (멤버별 금액) */}
                        {settlementMembers && settlementMembers.length > 0 && (() => {
                            // "나"와 기타 멤버 구분
                            const me = settlementMembers.find((m) => m.isLeader || m.isMe);
                            const others = settlementMembers.filter((m) => !(m.isLeader || m.isMe));

                            // 단순 N빵 조건 체크
                            const isGenericNames =
                                others.length > 0 &&
                                others.every((m) => {
                                    const name = (m.name || '').trim();
                                    return (
                                        name.startsWith('멤버') ||
                                        name.startsWith('사람') ||
                                        name.startsWith('참여자') ||
                                        /^[0-9]/.test(name)
                                    );
                                });

                            const firstAmount = others.length > 0 ? Math.abs(getMemberData(others[0]).amount || 0) : null;
                            const isSameAmount =
                                others.length > 0 &&
                                firstAmount !== null &&
                                others.every((m) => Math.abs(getMemberData(m).amount || 0) === firstAmount);

                            const isSimpleSplit = isGenericNames && isSameAmount;

                            // 리더 정보 (송금 링크)
                            const leaderData = me ? getMemberData(me) : {};
                            const sanitize = (v) => (v && v !== 'null' ? v : null);
                            const leaderTossLink = sanitize(leaderData.tossLink);
                            const leaderKakaoLink = sanitize(leaderData.kakaoLink);
                            const leaderDepositCopyText = sanitize(leaderData.depositCopyText);

                            if (isSimpleSplit) {
                                const memberNamesText =
                                    others.length > 0
                                        ? `${others[0].name} ~ ${others[others.length - 1].name}`
                                        : '';
                                return (
                                    <div className="mb-4 pb-4 border-b border-gray-100 space-y-3">
                                        <p className="text-sm font-semibold text-gray-900 mb-1">멤버별 정산 결과</p>
                                        {/* 나 (총무) 카드만 표시 */}
                                        {me && (
                                            <div className="p-4 sm:p-5 rounded-2xl border bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <p className="text-base font-semibold text-gray-900 truncate">
                                                        {me.name}
                                                    </p>
                                                    <span className="flex-shrink-0 px-2 py-0.5 bg-[#3182F6]/10 text-[#3182F6] text-xs font-medium rounded-full">
                                                        총무
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#3182F6] font-medium mt-0.5">
                                                    단순 N빵 결과 요약
                                                </p>
                                            </div>
                                        )}

                                        {/* N빵 요약 카드 */}
                                        <div className="p-4 sm:p-5 rounded-2xl border border-[#3182F6]/30 bg-[#f5f8ff] shadow-sm">
                                            <p className="text-sm font-semibold text-gray-900 mb-2">1인당 송금 금액</p>
                                            <p className="text-3xl font-bold text-[#0f172a] tracking-tight mb-1">
                                                {formatNumber(firstAmount || 0)}원
                                            </p>
                                            <p className="text-xs text-gray-500 mb-4">
                                                총 {others.length}명 ({memberNamesText})
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                {leaderTossLink && (
                                                    <a
                                                        href={leaderTossLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full sm:w-auto px-4 py-2.5 text-sm flex items-center justify-center gap-2 font-semibold bg-[#1350fe] text-white rounded-xl transition-all md:hover:bg-[#0d3fc7] active:scale-95 active:bg-[#0d3fc7] shadow-sm touch-manipulation min-h-[44px]"
                                                    >
                                                        <img src="/images/result_toss.png" alt="toss" className="w-4 h-4" />
                                                        송금하기
                                                    </a>
                                                )}
                                                {leaderKakaoLink && (
                                                    <a
                                                        href={leaderKakaoLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full sm:w-auto px-4 py-2.5 text-sm flex items-center justify-center gap-2 font-semibold bg-[#fee500] text-[#191f28] rounded-xl transition-all md:hover:bg-[#fdd835] active:scale-95 active:bg-[#fdd835] shadow-sm touch-manipulation min-h-[44px]"
                                                    >
                                                        <img src="/images/kakao 2.png" alt="kakao" className="w-4 h-4" />
                                                        송금하기
                                                    </a>
                                                )}
                                                {!leaderTossLink && !leaderKakaoLink && (
                                                    <div className="w-full px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-500 rounded-xl text-center">
                                                        송금 정보 없음
                                                    </div>
                                                )}
                                                {!leaderTossLink && !leaderKakaoLink && leaderDepositCopyText && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await navigator.clipboard.writeText(leaderDepositCopyText);
                                                                setToastPopUp(true);
                                                            } catch (error) {
                                                                const textArea = document.createElement('textarea');
                                                                textArea.value = leaderDepositCopyText;
                                                                document.body.appendChild(textArea);
                                                                textArea.select();
                                                                document.execCommand('copy');
                                                                document.body.removeChild(textArea);
                                                                setToastPopUp(true);
                                                            }
                                                        }}
                                                        className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl transition-all md:hover:bg-gray-200 active:scale-95 active:bg-gray-200 touch-manipulation min-h-[44px]"
                                                    >
                                                        계좌 복사
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // 기본 렌더링
                            return (
                                <div className="mb-4 pb-4 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900 mb-4">멤버별 정산 결과</p>
                                    <div className="space-y-2.5">
                                        {(() => {
                                            // "나"를 맨 위에, 나머지 멤버들을 뒤에 배치
                                            const sortedMembers = me ? [me, ...others] : others;

                                            return sortedMembers.map((member, idx) => {
                                                const memberKey = member.member_id || member.name;
                                                const memberData = getMemberData(member);
                                                const amount = memberData.amount || 0;
                                                const sanitize = (v) =>
                                                    v && v !== 'null' ? v : null;
                                                const memberTossLink = sanitize(memberData.tossLink);
                                                const memberKakaoLink = sanitize(memberData.kakaoLink);
                                                const depositCopyText = sanitize(memberData.depositCopyText);
                                                const hasToss = !!memberTossLink;
                                                const hasKakao = !!memberKakaoLink;
                                                const isTipped = tippedModeByMember[memberKey] || false;
                                                const isMe = member.isLeader || member.isMe;
                                                const isPaying = amount > 0;
                                                const isReceiving = amount < 0;
                                                // tipped_amount가 null이면 십원 단위 올림 UI 숨기기
                                                const hasTippedAmount = !!(
                                                    member.tipped_amount ??
                                                    member.settlement_tipped_amount
                                                );

                                                return (
                                                    <div
                                                        key={`${member.name}-${idx}`}
                                                        className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 md:hover:shadow-md ${
                                                            isMe
                                                                ? 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200'
                                                                : isReceiving
                                                                ? 'bg-gradient-to-br from-red-50/80 to-red-50/40 border-red-200/60'
                                                                : isTipped
                                                                ? 'bg-white border-[#3182F6] ring-1 ring-[#3182F6]/30 shadow-sm'
                                                                : 'bg-white border-gray-200 md:hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-4 mb-3">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <p className="text-base font-semibold text-gray-900 truncate">
                                                                        {member.name}
                                                                    </p>
                                                                    {isMe && (
                                                                        <span className="flex-shrink-0 px-2 py-0.5 bg-[#3182F6]/10 text-[#3182F6] text-xs font-medium rounded-full">
                                                                            총무
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {isMe ? (
                                                                    // Case: 나 (Leader/Me)
                                                                    <>
                                                                        {isPaying && (
                                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                                내 부담금
                                                                            </p>
                                                                        )}
                                                                        {isReceiving && (
                                                                            <p className="text-xs text-[#3182F6] font-medium mt-0.5">
                                                                                최종 받을 돈
                                                                            </p>
                                                                        )}
                                                                        {amount === 0 && (
                                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                                정산 완료
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    // Case: 다른 멤버
                                                                    <>
                                                                        {isReceiving && (
                                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                                <span className="text-xs">🔥</span>
                                                                                <p className="text-xs text-red-600 font-medium">
                                                                                    총무님이 {member.name}님에게 보내주세요
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {/* 계좌 복사 버튼 (유저 이름 밑에 배치, 받는 사람은 제외) */}
                                                                {!isMe && !isReceiving && depositCopyText && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                await navigator.clipboard.writeText(depositCopyText);
                                                                                setToastPopUp(true);
                                                                            } catch (error) {
                                                                                console.error('복사 실패:', error);
                                                                                const textArea = document.createElement('textarea');
                                                                                textArea.value = depositCopyText;
                                                                                document.body.appendChild(textArea);
                                                                                textArea.select();
                                                                                document.execCommand('copy');
                                                                                document.body.removeChild(textArea);
                                                                                setToastPopUp(true);
                                                                            }
                                                                        }}
                                                                        className="mt-2 px-3 py-2 text-xs flex items-center gap-1.5 font-medium bg-gray-100 text-gray-700 rounded-lg transition-all md:hover:bg-gray-200 active:scale-95 active:bg-gray-200 w-fit touch-manipulation min-h-[36px]"
                                                                    >
                                                                        <Copy size={12} />
                                                                        계좌 복사
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                {/* 금액 표시 */}
                                                                <p
                                                                    className={`text-xl font-bold tracking-tight ${
                                                                        isMe && isReceiving
                                                                            ? 'text-[#3182F6]'
                                                                            : isReceiving
                                                                            ? 'text-red-600'
                                                                            : 'text-gray-900'
                                                                    }`}
                                                                >
                                                                    {formatNumber(Math.abs(amount))}원
                                                                </p>
                                                                {/* 10원 단위 올림 토글 (총무 제외, tipped_amount가 있을 때만) */}
                                                                {!isMe && hasTippedAmount && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-gray-500">
                                                                            십원 단위 올림
                                                                        </span>
                                                                        <button
                                                                            onClick={() =>
                                                                                toggleMemberTipped(
                                                                                    memberKey,
                                                                                )
                                                                            }
                                                                            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                                                                                isTipped
                                                                                    ? 'bg-[#3182F6]'
                                                                                    : 'bg-gray-200'
                                                                            }`}
                                                                        >
                                                                            <div
                                                                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                                                                    isTipped
                                                                                        ? 'translate-x-5'
                                                                                        : 'translate-x-0'
                                                                                }`}
                                                                            />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* 송금 버튼 (총무는 송금 정보 표시 안 함) */}
                                                        {!isMe && (
                                                            <div className={`flex items-center gap-2 ${isReceiving ? 'mt-3 pt-3 border-t border-red-200/50' : ''}`}>
                                                                {isPaying ? (
                                                                    // Case: 멤버가 총무에게 보내야 함 (amount > 0)
                                                                    <>
                                                                        {hasToss && (
                                                                            <a
                                                                                href={memberTossLink}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex-1 md:hidden px-4 py-2.5 text-sm flex items-center justify-center gap-2 font-medium bg-[#1350fe] text-white rounded-xl transition-all md:hover:bg-[#0d3fc7] active:scale-95 active:bg-[#0d3fc7] shadow-sm touch-manipulation min-h-[44px]"
                                                                            >
                                                                                <img src="/images/result_toss.png" alt="toss" className="w-4 h-4" />
                                                                                토스 송금
                                                                            </a>
                                                                        )}
                                                                        {hasKakao && (
                                                                            <a
                                                                                href={memberKakaoLink}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex-1 md:hidden px-4 py-2.5 text-sm flex items-center justify-center gap-1.5 font-medium bg-[#fee500] text-[#191f28] rounded-xl transition-all md:hover:bg-[#fdd835] active:scale-95 active:bg-[#fdd835] shadow-sm touch-manipulation min-h-[44px]"
                                                                            >
                                                                                <img src="/images/kakao 2.png" alt="kakao" className="w-4 h-4" />
                                                                                카카오 송금
                                                                            </a>
                                                                        )}

                                                                        {!hasToss && !hasKakao && (
                                                                            <div className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-500 rounded-xl text-center">
                                                                                송금 정보 없음
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    // Case: 총무가 멤버에게 보내야 함 (amount < 0)
                                                                    <>
                                                                        {hasToss && (
                                                                            <a
                                                                                href={memberTossLink}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex-1 md:hidden px-4 py-2.5 text-sm flex items-center justify-center gap-2 font-medium bg-[#1350fe] text-white rounded-xl transition-all md:hover:bg-[#0d3fc7] active:scale-95 active:bg-[#0d3fc7] shadow-sm touch-manipulation min-h-[44px]"
                                                                            >
                                                                                <img src="/images/result_toss.png" alt="toss" className="w-4 h-4" />
                                                                                토스 송금
                                                                            </a>
                                                                        )}
                                                                        {hasKakao && (
                                                                            <a
                                                                                href={memberKakaoLink}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex-1 md:hidden px-4 py-2.5 text-sm flex items-center justify-center gap-1.5 font-medium bg-[#fee500] text-[#191f28] rounded-xl transition-all md:hover:bg-[#fdd835] active:scale-95 active:bg-[#fdd835] shadow-sm touch-manipulation min-h-[44px]"
                                                                            >
                                                                                <img src="/images/kakao 2.png" alt="kakao" className="w-4 h-4" />
                                                                                카카오 송금
                                                                            </a>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 액션 버튼 (뷰어 모드가 아닐 때만 표시) */}
                        {!isViewerMode && (
                            <>
                                <div className="flex gap-2 mb-3">
                                    {/* 정산 결과 링크 복사 */}
                                    <button
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3182F6] text-white rounded-lg md:hover:bg-[#1E6FFF] active:bg-[#1E6FFF] transition-colors text-sm font-medium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                                        onClick={handleCopyLink}
                                        disabled={isCreating}
                                    >
                                        {isCreating ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Copy size={16} />
                                                정산 결과 링크
                                            </>
                                        )}
                                    </button>

                                    {/* 정산 결과 수정하기 */}
                                    <button
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg md:hover:bg-gray-200 active:bg-gray-200 transition-colors text-sm font-medium active:scale-95 touch-manipulation min-h-[44px]"
                                        onClick={handleEdit}
                                    >
                                        <Edit size={16} />
                                        정산 결과 수정
                                    </button>
                                </div>

                                {/* 새로운 AI 분석 안내 디자인 */}
                                <div className="flex flex-col sm:flex-row items-center gap-2 p-4 rounded-lg bg-blue-50 border border-blue-100 shadow-none sm:shadow-sm">
                                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-blue-100 mb-1 sm:mb-0">
                                        <Sparkles size={15} className="text-blue-500" />
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="text-base font-bold text-blue-700 mb-1">AI 정산 완료</p>
                                        <div className="flex items-center justify-center sm:justify-start gap-2">
                                            <span className="text-sm text-gray-700">
                                                그래도 혹시 모르니 눈으로 쓱- 봐주세요 👀
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 수정 모달 */}
            {showEditModal && (
                <DraftEditModal
                    aiData={editedData}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleEditComplete}
                    meetingId={meetingId}
                />
            )}

            {/* 토스트 팝업 */}
            {toastPopUp && (
                <ToastPopUp
                    message={toastMessage}
                    setToastPopUp={setToastPopUp}
                    type={toastType}
                />
            )}

            {/* 토스/카카오 설정 모달 */}
            {showTossModal && (
                <BillingTossModal
                    setTossModalOpen={(open) => {
                        setShowTossModal(open);
                        if (!open && onUserUpdate) {
                            // 모달이 닫힐 때 사용자 정보 갱신
                            onUserUpdate();
                        }
                    }}
                    meetingName={meetingId}
                    user={user}
                />
            )}
            {showKakaoModal && (
                <BillingKakaoModal
                    setKakaoModalOpen={(open) => {
                        setShowKakaoModal(open);
                        if (!open && onUserUpdate) {
                            // 모달이 닫힐 때 사용자 정보 갱신
                            onUserUpdate();
                        }
                    }}
                    meetingName={meetingId}
                    user={user}
                />
            )}
        </>
    );
};

export default DraftCard;
