import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AiMeetingDetail = ({ meetingData }) => {
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // 첫 번째 payment의 데이터 사용
    const payment = meetingData.payments?.[0];
    const images = payment?.images || [];
    const paymentItems = payment?.paymentItems || [];

    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
    };

    // 총액 계산
    const totalAmount = paymentItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
    );

    // 다음 이미지
    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    // 이전 이미지
    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ChevronLeft size={20} className="text-gray-700" />
                </button>
                <div className="flex items-center gap-2 flex-1">
                    <Sparkles size={18} className="text-[#3182F6]" />
                    <h1 className="text-lg font-semibold text-gray-900">
                        {meetingData.name || 'AI 정산'}
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* 영수증 이미지 슬라이더 */}
                {images.length > 0 && (
                    <div className="relative w-full bg-gray-100">
                        <div className="relative aspect-[4/3] overflow-hidden">
                            <img
                                src={images[currentImageIndex]?.url || images[currentImageIndex]}
                                alt={`영수증 ${currentImageIndex + 1}`}
                                className="w-full h-full object-contain"
                            />
                            
                            {/* 이미지 네비게이션 */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={handlePrevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                    >
                                        <ChevronLeft size={20} className="text-white" />
                                    </button>
                                    <button
                                        onClick={handleNextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                    >
                                        <ChevronRight size={20} className="text-white" />
                                    </button>
                                    
                                    {/* 이미지 인디케이터 */}
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {images.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                    index === currentImageIndex
                                                        ? 'bg-white w-4'
                                                        : 'bg-white/50'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* 상세 정보 */}
                <div className="p-4 space-y-6">
                    {/* 모임 정보 */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">
                            {meetingData.name || 'AI 정산'}
                        </h2>
                        {meetingData.date && (
                            <p className="text-sm text-gray-500">
                                {meetingData.date}
                            </p>
                        )}
                    </div>

                    {/* 상세 품목 리스트 */}
                    {paymentItems.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">
                                상세 내역
                            </h3>
                            <div className="space-y-4">
                                {paymentItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {item.name || '항목'}
                                                </p>
                                                {item.quantity > 1 && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        수량: {item.quantity}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 ml-4">
                                                {formatNumber(
                                                    (item.price || 0) * (item.quantity || 1)
                                                )}
                                                원
                                            </p>
                                        </div>
                                        
                                        {/* 참여자 뱃지 */}
                                        {item.attendees && item.attendees.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {item.attendees.map((attendee, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                                                    >
                                                        {attendee}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* 총액 */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm text-gray-600">
                                        총 정산 금액
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {formatNumber(totalAmount)}원
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiMeetingDetail;



