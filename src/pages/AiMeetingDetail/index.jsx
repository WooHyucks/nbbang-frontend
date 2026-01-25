import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAiMeetingById, modifyMeetingByAi } from '../../api/api';
import LoadingSpinner from '../../components/common/LodingSpinner';
import { Copy, ChevronLeft, Sparkles } from 'lucide-react';
import { sendEventToAmplitude } from '../../utils/amplitude';
import DraftCard from '../../components/AiChat/cards/DraftCard';
import InputArea from '../../components/AiChat/InputArea';

/**
 * AI 정산 상세 페이지 (Owner View) - 채팅 인터페이스
 * Route: /meeting/ai/:id
 * API: GET /meeting/ai/:id (인증 필요)
 */
const AiMeetingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentMeeting, setCurrentMeeting] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isModifying, setIsModifying] = useState(false);
    const [isLinkCopied, setIsLinkCopied] = useState(false);
    const [error, setError] = useState(null);
    const [toastPopUp, setToastPopUp] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // 초기 데이터 로드
    useEffect(() => {
        const fetchAiMeeting = async () => {
            if (!id) {
                setError('정산 ID가 올바르지 않습니다.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const data = await getAiMeetingById(id);
                setCurrentMeeting(data);
                
                // 채팅 히스토리 초기화
                initializeChatHistory(data);
            } catch (err) {
                console.error('AI 정산 데이터 가져오기 실패:', err);
                setError('정산 내역을 불러올 수 없습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAiMeeting();
    }, [id]);

    // 채팅 히스토리 초기화
    const initializeChatHistory = (meetingData) => {
        const payment = meetingData?.payments?.[0];
        const images = payment?.images || [];
        const paymentItems = payment?.paymentItems || [];
        const imageUrls = images.map((img) => img.url || img);

        const history = [];

        // Msg 1 (User): 영수증 이미지들
        if (imageUrls.length > 0) {
            imageUrls.forEach((imageUrl, index) => {
                history.push({
                    id: `user-image-${index}`,
                    type: 'user',
                    content: {
                        type: 'image',
                        imageUrl: imageUrl,
                    },
                    timestamp: new Date().toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                });
            });
        }

        // Msg 2 (AI): 안내 텍스트 + DraftCard
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

        history.push({
            id: 'ai-intro',
            type: 'ai',
            content: {
                type: 'text',
                text: '정산 내역을 정리했습니다.',
            },
            timestamp: new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        });

        history.push({
            id: 'ai-draft-card',
            type: 'ai',
            content: {
                type: 'draft_card',
                aiData: aiData,
                imageUrls: imageUrls,
            },
            timestamp: new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        });

        setChatHistory(history);
    };

    // 수정 요청 처리
    const handleModify = async (text, files = []) => {
        const prompt = text?.trim() || '';
        if (!prompt || !id) return;

        // 사용자 메시지 추가
        const userMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: {
                type: 'text',
                text: prompt,
            },
            timestamp: new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };

        setChatHistory((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsModifying(true);

        try {
            // 수정 API 호출
            const modifiedMeeting = await modifyMeetingByAi(id, prompt.trim());

            // currentMeeting 업데이트
            setCurrentMeeting(modifiedMeeting);

            // AI 응답 메시지 추가
            const payment = modifiedMeeting?.payments?.[0];
            const paymentItems = payment?.paymentItems || [];
            const images = payment?.images || [];
            const imageUrls = images.map((img) => img.url || img);

            const aiData = {
                meeting_name: modifiedMeeting?.name || 'AI 정산',
                date: modifiedMeeting?.date || '',
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

            const aiTextMessage = {
                id: `ai-text-${Date.now()}`,
                type: 'ai',
                content: {
                    type: 'text',
                    text: '수정했습니다.',
                },
                timestamp: new Date().toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            };

            const aiCardMessage = {
                id: `ai-card-${Date.now()}`,
                type: 'ai',
                content: {
                    type: 'draft_card',
                    aiData: aiData,
                    imageUrls: imageUrls,
                },
                timestamp: new Date().toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            };

            setChatHistory((prev) => [...prev, aiTextMessage, aiCardMessage]);

            // Amplitude 이벤트
            sendEventToAmplitude('modify ai settlement', {
                meeting_id: id,
                prompt: prompt.trim(),
            });
        } catch (error) {
            console.error('정산 수정 실패:', error);
            const errorMessage = {
                id: `ai-error-${Date.now()}`,
                type: 'ai',
                content: {
                    type: 'text',
                    text: '수정 중 오류가 발생했습니다. 다시 시도해주세요.',
                },
                timestamp: new Date().toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            };
            setChatHistory((prev) => [...prev, errorMessage]);
        } finally {
            setIsModifying(false);
        }
    };

    // 공유 링크 생성 및 복사
    const handleShare = async () => {
        if (!currentMeeting?.uuid) {
            setToastMessage('공유 링크를 생성할 수 없습니다.');
            setToastType('error');
            setToastPopUp(true);
            return;
        }

        const baseLink = `${window.location.origin}/share?ai=${currentMeeting.uuid}`;
        const shareLink = `${baseLink}&v=${Date.now()}`;

        try {
            await navigator.clipboard.writeText(shareLink);
            setIsLinkCopied(true);
            setToastMessage('링크가 복사되었습니다.');
            setToastType('success');
            setToastPopUp(true);
            
            sendEventToAmplitude('share ai settlement', {
                meeting_id: id,
                meeting_name: currentMeeting?.name,
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
            <div className="flex justify-center items-center h-screen bg-[#F2F4F6]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !currentMeeting) {
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
                        {currentMeeting.name || 'AI 정산'}
                    </h1>
                </div>
            </div>

            {/* 채팅 히스토리 */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
                <div className="max-w-full sm:max-w-2xl mx-auto space-y-3 sm:space-y-4">
                    {chatHistory.map((message) => (
                        <div
                            key={message.id}
                            className={`flex items-start gap-2 sm:gap-3 ${
                                message.type === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            {/* AI 아이콘 */}
                            {message.type === 'ai' && (
                                <div className="flex-shrink-0 mt-1">
                                    <Sparkles size={18} className="text-[#3182F6]" />
                                </div>
                            )}

                            {/* 메시지 컨텐츠 */}
                            <div
                                className={`w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] ${
                                    message.type === 'user' ? 'flex justify-end' : ''
                                }`}
                            >
                                {message.content.type === 'text' && (
                                    <div
                                        className={`rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 ${
                                            message.type === 'user'
                                                ? 'bg-[#3182F6] text-white rounded-br-sm shadow-sm'
                                                : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200 shadow-sm'
                                        }`}
                                    >
                                        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                                            {message.content.text}
                                        </p>
                                        {message.timestamp && (
                                            <p
                                                className={`text-xs mt-2.5 ${
                                                    message.type === 'user'
                                                        ? 'text-blue-100'
                                                        : 'text-gray-400'
                                                }`}
                                            >
                                                {message.timestamp}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {message.content.type === 'image' && (
                                    <div className="bg-white rounded-2xl rounded-br-sm overflow-hidden shadow-sm">
                                        <img
                                            src={message.content.imageUrl}
                                            alt="영수증"
                                            className="w-full h-auto max-w-full sm:max-w-[400px]"
                                        />
                                    </div>
                                )}

                                {message.content.type === 'draft_card' && (
                                    <div className="w-full">
                                        <DraftCard
                                            aiData={message.content.aiData}
                                            imageUrls={message.content.imageUrls}
                                            isViewerMode={true}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* 수정 중 로딩 */}
                    {isModifying && (
                        <div className="flex items-start gap-2 sm:gap-3 justify-start">
                            <div className="flex-shrink-0 mt-1">
                                <Sparkles size={18} className="text-[#3182F6]" />
                            </div>
                            <div className="w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200 shadow-sm px-4 sm:px-5 py-3 sm:py-3.5">
                                <p className="text-sm sm:text-base">수정 중...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 입력 영역 및 공유하기 버튼 (하단 고정) */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200">
                {/* 입력 영역 */}
                <div className="px-4 pt-3">
                    <InputArea
                        value={inputValue}
                        onChange={setInputValue}
                        onSend={handleModify}
                        showSuggestions={false}
                        isLoading={isModifying}
                    />
                </div>
                
                {/* 공유하기 버튼 */}
                <div className="px-4 pb-3 pt-2">
                    <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium active:scale-95"
                    >
                        {isLinkCopied ? (
                            <>
                                <Copy size={16} />
                                링크가 복사되었습니다
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                결과 공유하기
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiMeetingDetail;
