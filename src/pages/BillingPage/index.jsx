import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Billing from '../../components/billing/Billing';
import BillingMember from '../../components/billing/BillingMember';
import BillingName from '../../components/billing/BillingName';
import BillingPayment from '../../components/billing/BillingPayment';
import AiMeetingDetail from '../../components/billing/AiMeetingDetail';
import AiSettlementView from '../../components/AiChat/AiSettlementView';
import { getMeetingDetail } from '../../api/api';
import LoadingSpinner from '../../components/common/LodingSpinner';
import { Copy } from 'lucide-react';
import { sendEventToAmplitude } from '../../utils/amplitude';
import ToastPopUp from '../../components/common/ToastPopUp';

const BillingPage = () => {
    const { meetingId } = useParams();
    const [member, setMember] = useState([]);
    const [payment, setPayment] = useState([]);
    const [meetingName, setMeetingName] = useState([]);
    const [meetingData, setMeetingData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiType, setIsAiType] = useState(false);
    const [isLinkCopied, setIsLinkCopied] = useState(false);
    const [toastPopUp, setToastPopUp] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    useEffect(() => {
        const fetchMeetingData = async () => {
            if (!meetingId) return;
            
            setIsLoading(true);
            try {
                const data = await getMeetingDetail(meetingId);
                setMeetingData(data);
                // meetingType === 'ai' 또는 is_ai === true 체크
                setIsAiType(
                    data?.meetingType === 'ai' ||
                    data?.is_ai === true ||
                    data?.type === 'AI'
                );
                
                // 모임 정산 페이지 조회 이벤트 (AI 타입이 아닐 때만)
                if (!(data?.meetingType === 'ai' || data?.is_ai === true || data?.type === 'AI')) {
                    sendEventToAmplitude('view meeting settlement page', {
                        meeting_id: meetingId,
                    });
                }
            } catch (error) {
                console.error('모임 데이터 가져오기 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMeetingData();
    }, [meetingId]);

    // 공유 링크 생성 및 복사
    const handleShare = async () => {
        if (!meetingData?.uuid) {
            setToastMessage('공유 링크를 생성할 수 없습니다.');
            setToastType('error');
            setToastPopUp(true);
            return;
        }

        const shareLink = `${window.location.origin}/share?ai=${meetingData.uuid}`;

        try {
            await navigator.clipboard.writeText(shareLink);
            setIsLinkCopied(true);
            setToastMessage('링크가 복사되었습니다.');
            setToastType('success');
            setToastPopUp(true);
            
            sendEventToAmplitude('share ai settlement', {
                meeting_id: meetingId,
                meeting_name: meetingData?.name,
            });

            setTimeout(() => setIsLinkCopied(false), 2000);
        } catch (error) {
            console.error('링크 복사 실패:', error);
            setToastMessage('링크 복사에 실패했습니다.');
            setToastType('error');
            setToastPopUp(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    // AI 타입일 경우 채팅 스타일 렌더링
    if (isAiType && meetingData) {
        return (
            <div className="flex flex-col h-screen bg-[#F2F4F6]">
                <AiSettlementView
                    meetingData={meetingData}
                    isViewerMode={false}
                />
                {/* 공유하기 버튼 (하단 고정) */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
                    <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3182F6] text-white rounded-xl hover:bg-[#1E6FFF] transition-colors text-sm font-medium active:scale-95"
                    >
                        {isLinkCopied ? (
                            <>
                                <Copy size={18} />
                                링크가 복사되었습니다
                            </>
                        ) : (
                            <>
                                <Copy size={18} />
                                결과 공유하기
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // 일반 타입일 경우 기존 렌더링
    return (
        <div className="flex flex-col h-full bg-white max-w-[450px] mx-auto text-center">
            <BillingName
                meetingName={meetingName}
                setMeetingName={setMeetingName}
            />
            <BillingMember
                member={member}
                setMember={setMember}
                setPayment={setPayment}
            />
            <BillingPayment
                member={member}
                payment={payment}
                setPayment={setPayment}
            />
            <Billing
                member={member}
                payment={payment}
                meetingName={meetingName}
                setMeetingName={setMeetingName}
            />

            {/* 토스트 팝업 */}
            {toastPopUp && (
                <ToastPopUp
                    message={toastMessage}
                    setToastPopUp={setToastPopUp}
                    type={toastType}
                />
            )}
        </div>
    );
};

export default BillingPage;
