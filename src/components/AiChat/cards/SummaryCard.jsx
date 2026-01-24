import React from 'react';
import { ExternalLink, Share2, Sparkles } from 'lucide-react';

const SummaryCard = ({ data }) => {
    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
    };

    return (
        <div className="w-full">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                {/* 카드 헤더 */}
                <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles
                            size={16}
                            className="text-[#3182F6] flex-shrink-0"
                        />
                        <h3 className="font-bold text-gray-900 text-base">
                            {data.name}
                        </h3>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">{data.date}</p>
                </div>

                {/* 총액 */}
                <div className="mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm text-gray-600">총 정산 금액</span>
                        <span className="text-2xl font-bold text-gray-900">
                            {formatNumber(data.total)}원
                        </span>
                    </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                    <button
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3182F6] text-white rounded-lg hover:bg-[#1E6FFF] transition-colors text-sm font-medium"
                        onClick={() => console.log('상세 내역 보기:', data.id)}
                    >
                        <ExternalLink size={16} />
                        상세 내역 보기
                    </button>
                    <button
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        onClick={() => console.log('공유:', data.id)}
                    >
                        <Share2 size={16} />
                        공유
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SummaryCard;

