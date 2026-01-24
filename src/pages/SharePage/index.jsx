import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAiMeetingByUuid } from '../../api/api';
import LoadingSpinner from '../../components/common/LodingSpinner';
import { ChevronLeft, X, ChevronRight, Sparkles } from 'lucide-react';
import DraftCard from '../../components/AiChat/cards/DraftCard';
import UserPromptBubble from '../../components/common/UserPromptBubble';

/**
 * AI 정산 공유 페이지 (Guest View) - ReadOnly 모드
 * Route: /share?ai=UUID
 * API: GET /meeting/ai/uuid/:uuid (인증 불필요)
 */
const SharePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [meetingData, setMeetingData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const scrollContainerRef = useRef(null);

    const uuid = searchParams.get('ai');

    useEffect(() => {
        const fetchAiMeeting = async () => {
            if (!uuid) {
                setError('공유 링크가 올바르지 않습니다.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const data = await getAiMeetingByUuid(uuid);
                setMeetingData(data);
            } catch (err) {
                console.error('AI 정산 데이터 가져오기 실패:', err);
                setError('정산 내역을 불러올 수 없습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAiMeeting();
    }, [uuid]);

    // 데이터 로드 후 페이지 최하단으로 스크롤
    useEffect(() => {
        if (!meetingData || !scrollContainerRef.current) return;
        requestAnimationFrame(() => {
            const el = scrollContainerRef.current;
            el.scrollTop = el.scrollHeight;
        });
    }, [meetingData]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#F2F4F6]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !meetingData) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-[#F2F4F6] px-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        오류가 발생했습니다
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        {error || '정산 내역을 찾을 수 없습니다.'}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full px-4 py-2.5 bg-[#3182F6] text-white rounded-lg hover:bg-[#1E6FFF] transition-colors text-sm font-medium"
                    >
                        홈으로 가기
                    </button>
                </div>
            </div>
        );
    }

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

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
    };

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    };

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

    return (
        <div className="flex flex-col h-screen bg-[#F2F4F6]">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 flex-1">
                        {meetingData.name || '정산 내역'}
                    </h1>
                </div>
            </div>

            {/* 채팅 히스토리 (ReadOnly) */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
                <div className="max-w-full sm:max-w-2xl mx-auto space-y-3 sm:space-y-4">
                    {/* 사용자 요청사항 말풍선 */}
                    <UserPromptBubble userPrompt={meetingData?.userPrompt || meetingData?.prompt} />

                    {/* 사용자 메시지: 영수증 이미지들 */}
                    {imageUrls.length > 0 && (
                        <div className="flex items-start justify-end">
                            <div className="w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] flex justify-end">
                                {imageUrls.length === 1 ? (
                                    <div className="bg-white rounded-2xl rounded-br-sm overflow-hidden shadow-sm w-full max-w-full sm:max-w-[400px]">
                                        <img
                                            src={imageUrls[0]}
                                            alt="영수증"
                                            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => {
                                                setCurrentImageIndex(0);
                                                setIsLightboxOpen(true);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-1 bg-white rounded-2xl rounded-br-sm overflow-hidden shadow-sm p-1 w-full max-w-full sm:max-w-[400px]">
                                        {imageUrls.slice(0, 4).map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt={`영수증 ${index + 1}`}
                                                className="w-full h-auto object-cover aspect-square rounded cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => {
                                                    setCurrentImageIndex(index);
                                                    setIsLightboxOpen(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI 메시지: 안내 텍스트 */}
                    <div className="flex items-start gap-2 sm:gap-3 justify-start">
                        <div className="flex-shrink-0 mt-1">
                            <Sparkles size={18} className="text-[#3182F6]" />
                        </div>
                        <div className="w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                            <div className="bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200 shadow-sm px-4 sm:px-5 py-3 sm:py-3.5">
                                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                                    AI가 정산 내역을 정리했습니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* AI 메시지: DraftCard */}
                    <div className="flex items-start gap-2 sm:gap-3 justify-start">
                        <div className="flex-shrink-0 mt-1">
                            <Sparkles size={18} className="text-[#3182F6]" />
                        </div>
                        <div className="w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                            <DraftCard
                                aiData={aiData}
                                imageUrls={imageUrls}
                                isViewerMode={true}
                                uuid={meetingData?.uuid}
                                settlementMembers={meetingData?.members || []}
                            />
                        </div>
                    </div>
                    
                    {/* AI로 정산하러 가기 버튼 (공유 페이지 하단) */}
                    <div className="flex items-start gap-2 sm:gap-3 justify-start mt-4">
                        <div className="flex-shrink-0 mt-1">
                            <Sparkles size={18} className="text-[#3182F6]" />
                        </div>
                        <div className="w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                            <button
                                onClick={() => {
                                    navigate('/');
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 active:from-blue-600 active:to-purple-600 transition-all text-sm font-semibold active:scale-95 shadow-sm touch-manipulation min-h-[44px]"
                            >
                                <Sparkles size={18} />
                                AI로 정산하러 가기
                            </button>
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
        </div>
    );
};

export default SharePage;

