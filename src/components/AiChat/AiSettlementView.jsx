import React from 'react';
import { Sparkles } from 'lucide-react';
import DraftCard from './cards/DraftCard';
import UserPromptBubble from '../common/UserPromptBubble';

/**
 * AI 정산 내역 뷰 컴포넌트
 * 상세 페이지와 공유 페이지에서 공통으로 사용하는 채팅 스타일 UI
 */
const AiSettlementView = ({ meetingData, isViewerMode = false }) => {
    // 첫 번째 payment의 데이터 사용
    const payment = meetingData?.payments?.[0];
    const images = payment?.images || [];
    const paymentItems = payment?.paymentItems || [];

    // AI 데이터 형식으로 변환
    const aiData = {
        meeting_name: meetingData?.name || 'AI 정산',
        date: meetingData?.date || '',
        members: [
            ...new Set(
                paymentItems.flatMap((item) => item.attendees || [])
            ),
        ],
        items: paymentItems.map((item) => ({
            name: item.name || '항목',
            price: (item.price || 0) * (item.quantity || 1),
            attendees: item.attendees || [],
        })),
    };

    // 이미지 URL 배열 (Base64 또는 URL)
    const imageUrls = images.map((img) => img.url || img);

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // 정산 내역 텍스트 생성
    const settlementText = `${formatDate(meetingData?.date)}, ${
        meetingData?.name || '정산'
    } 정산 내역입니다.`;

    return (
        <div className="flex flex-col h-full bg-[#F2F4F6]">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
                <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-[#3182F6]" />
                    <h1 className="text-lg font-semibold text-gray-900">
                        AI 정산 내역 🤖
                    </h1>
                </div>
            </div>

            {/* 채팅 스타일 본문 */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* 사용자 요청사항 말풍선 */}
                    <UserPromptBubble userPrompt={meetingData?.userPrompt || meetingData?.prompt} />

                    {/* AI 메시지: 정산 내역 안내 */}
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                            <Sparkles size={18} className="text-[#3182F6]" />
                        </div>
                        <div className="max-w-[85%] md:max-w-[70%] lg:max-w-[60%] bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {settlementText}
                            </p>
                        </div>
                    </div>

                    {/* AI 메시지: 정산 요약 카드 */}
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                            <Sparkles size={18} className="text-[#3182F6]" />
                        </div>
                        <div className="max-w-[85%] md:max-w-[70%] lg:max-w-[60%]">
                            <DraftCard
                                aiData={aiData}
                                imageUrls={imageUrls}
                                isViewerMode={isViewerMode}
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AiSettlementView;

