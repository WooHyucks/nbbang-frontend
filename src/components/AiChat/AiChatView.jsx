import React, { useState } from 'react';
import { Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
import DraftCard from './cards/DraftCard';

/**
 * AI 정산 채팅 뷰 컴포넌트
 * 사용자 메시지(영수증 이미지)와 AI 메시지(DraftCard)를 채팅 스타일로 표시
 */
const AiChatView = ({ meetingData, isOwner = false }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // 모든 payments의 데이터 수집
    const payments = meetingData?.payments || [];
    
    // 모든 payments에서 이미지 수집
    const allImages = payments.flatMap((p) => p.images || []);
    const imageUrls = allImages.map((img) => img.url || img);
    
    // 모든 payments에서 paymentItems 수집
    const allPaymentItems = payments.flatMap((p) => 
        (p.paymentItems || []).map((item) => ({
            ...item,
            // 각 payment의 payer 정보를 item에 추가
            payer: item.payer || p.payer || p.paid_by || null,
        }))
    );

    // AI 데이터 형식으로 변환
    const aiData = {
        meeting_name: meetingData?.name || 'AI 정산',
        date: meetingData?.date || '',
        members: [
            ...new Set(
                allPaymentItems.flatMap((item) => item.attendees || [])
            ),
        ],
        items: allPaymentItems.map((item) => ({
            name: item.name || '항목',
            price: (item.price || 0) * (item.quantity || 1),
            attendees: item.attendees || [],
            payer: item.payer || item.pay_member || item.paid_by || null,
        })),
    };
    const settlementMembers = meetingData?.members || [];

    // 다음 이미지
    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
    };

    // 이전 이미지
    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    };

    // 이미지 클릭 시 라이트박스 열기
    const handleImageClick = (index) => {
        setCurrentImageIndex(index);
        setIsLightboxOpen(true);
    };

    return (
        <>
            <div className="flex flex-col h-full bg-[#F2F4F6]">
                {/* 채팅 스타일 본문 */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {/* 사용자 메시지: 영수증 이미지 (오른쪽) */}
                        {imageUrls.length > 0 && (
                            <div className="flex items-start gap-3 justify-end">
                                <div className="max-w-[85%] md:max-w-[70%] lg:max-w-[60%]">
                                    <div className="bg-white rounded-2xl rounded-br-sm overflow-hidden shadow-sm">
                                        {/* 이미지 그리드 */}
                                        {imageUrls.length === 1 ? (
                                            <img
                                                src={imageUrls[0]}
                                                alt="영수증"
                                                className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => handleImageClick(0)}
                                            />
                                        ) : (
                                            <div className="grid grid-cols-2 gap-1 p-1">
                                                {imageUrls.slice(0, 4).map((url, index) => (
                                                    <img
                                                        key={index}
                                                        src={url}
                                                        alt={`영수증 ${index + 1}`}
                                                        className="w-full h-auto object-cover aspect-square cursor-pointer hover:opacity-90 transition-opacity rounded"
                                                        onClick={() => handleImageClick(index)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI 메시지: 정산 내역 안내 (왼쪽) */}
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <Sparkles size={18} className="text-[#3182F6]" />
                            </div>
                            <div className="max-w-[85%] md:max-w-[70%] lg:max-w-[60%] bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-3">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {meetingData?.name || '영수증'} 영수증이네요! 내역을 정리해 드립니다.
                                </p>
                            </div>
                        </div>

                        {/* AI 메시지: 정산 요약 카드 (왼쪽) */}
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <Sparkles size={18} className="text-[#3182F6]" />
                            </div>
                            <div className="max-w-[85%] md:max-w-[70%] lg:max-w-[60%]">
                                <DraftCard
                                    aiData={aiData}
                                    imageUrls={imageUrls}
                                    isViewerMode={!isOwner}
                                    uuid={meetingData?.uuid}
                                    settlementMembers={settlementMembers}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 라이트박스 (이미지 확대) */}
            {isLightboxOpen && imageUrls.length > 0 && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={24} className="text-white" />
                    </button>

                    {imageUrls.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrevImage();
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <ChevronLeft size={24} className="text-white" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNextImage();
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <ChevronRight size={24} className="text-white" />
                            </button>
                        </>
                    )}

                    <img
                        src={imageUrls[currentImageIndex]}
                        alt={`영수증 ${currentImageIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {imageUrls.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {imageUrls.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex(index);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        index === currentImageIndex
                                            ? 'bg-white w-6'
                                            : 'bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default AiChatView;

