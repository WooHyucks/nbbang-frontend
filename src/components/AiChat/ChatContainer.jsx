import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Camera, Receipt } from 'lucide-react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import { transformToWebp } from '../../utils/transformToWebp';
import { analyzeAndCreateMeeting } from '../../api/ai';
import { getAiMeetingById, modifyMeetingByAi, getUserData } from '../../api/api';
import { sendEventToAmplitude } from '@/utils/amplitude';
import AiAnalysisLimitModal from '../Modal/AiAnalysisLimitModal';

const ChatContainer = ({ userName, meetingId, onSettlementCreated, user, onUserUpdate }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesContainerRef = useRef(null);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [clearFilesTrigger, setClearFilesTrigger] = useState(0);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitModalType, setLimitModalType] = useState('personal'); // 'personal' | 'server'

    // 일반 스크롤
    const scrollToBottom = () => {
        if (!messagesContainerRef.current) return;
        const el = messagesContainerRef.current;
        el.scrollTop = el.scrollHeight;
    };

    // 스무스 스크롤
    const smoothScrollToBottom = () => {
        if (!messagesContainerRef.current) return;
        const el = messagesContainerRef.current;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    };

    // meetingId가 변경되면 해당 정산 내역을 채팅 형식으로 로드 (수정 모드)
    useEffect(() => {
        const loadAiSettlement = async () => {
            if (!meetingId) {
                // meetingId가 없으면 생성 모드 (메시지 초기화)
                setMessages([]);
                setInputValue('');
                setIsLoading(false);
                return;
            }

            // meetingId가 변경되면 메시지 초기화 후 로딩 시작
            setMessages([]);
            setIsLoading(true);
            try {
                // 유저 데이터와 미팅 데이터를 동시에 불러오기 (Promise.all)
                const [meetingResponse, userResponse] = await Promise.all([
                    getAiMeetingById(meetingId),
                    getUserData('user').catch(() => null) // 유저 데이터가 없어도 계속 진행
                ]);

                const meetingData = meetingResponse;
                
                // 유저 데이터가 있으면 업데이트
                if (userResponse && onUserUpdate) {
                    let userData = userResponse.data;
                    if (userData?.data) {
                        userData = userData.data;
                    } else if (userData?.user) {
                        userData = userData.user;
                    }
                    onUserUpdate();
                }
                
                // 메시지 배열 초기화
                const newMessages = [];

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

                // 1. 사용자 메시지: userPrompt (텍스트) - 있으면 먼저 표시
                const userPrompt = meetingData?.userPrompt || meetingData?.prompt;
                if (userPrompt && userPrompt.trim()) {
                    newMessages.push({
                        id: 'user-prompt',
                        sender: 'user',
                        type: 'text',
                        text: userPrompt,
                        timestamp: new Date().toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                    });
                }

                // 2. 사용자 메시지: 영수증 이미지들
                if (imageUrls.length > 0) {
                    imageUrls.forEach((imageUrl, index) => {
                        newMessages.push({
                            id: `user-image-${index}`,
                            sender: 'user',
                            type: 'image',
                            imageUrl: imageUrl,
                            timestamp: new Date().toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            }),
                        });
                    });
                }

                // 2. AI 메시지: 안내 텍스트
                newMessages.push({
                    id: 'ai-intro',
                    sender: 'ai',
                    type: 'text',
                    text: `${meetingData?.name || '영수증'} 영수증이네요! 내역을 정리해 드립니다.`,
                    timestamp: new Date().toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                });

                // 3. AI 메시지: DraftCard
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

                newMessages.push({
                    id: 'ai-draft-card',
                    sender: 'ai',
                    type: 'draft_card',
                    aiData: aiData,
                    imageUrls: imageUrls,
                    isViewerMode: false,
                    uuid: meetingData?.uuid, // uuid 전달
                    meetingId: meetingId, // meetingId 전달
                });

                setMessages(newMessages);
            } catch (error) {
                console.error('AI 정산 내역 로드 실패:', error);
                setMessages([{
                    id: 'error',
                    sender: 'ai',
                    type: 'text',
                    text: '정산 내역을 불러오는데 실패했습니다.',
                    timestamp: new Date().toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                }]);
            } finally {
                setIsLoading(false);
            }
        };

        loadAiSettlement();
    }, [meetingId]);

    // 메시지 변경 또는 isLoading 값이 변경될 때 스크롤 동작 제어
    useEffect(() => {
        // isLoading이 true일 때는 스무스하게 최하단 스크롤
        if (isLoading) {
            setTimeout(() => {
            smoothScrollToBottom();
            }, 100);
        } else {
            requestAnimationFrame(scrollToBottom);
        }
    }, [messages, isLoading]);
    
    const handleSendMessage = async (text, files = []) => {
        // 텍스트와 파일이 모두 없으면 리턴
        const promptText = text.trim();
        if (!promptText && (!files || files.length === 0)) return;

        // 수정 모드가 아닐 때만 유효성 검사 (생성 모드)
        const isModifyMode = !!meetingId;
        if (!isModifyMode) {
        // 유효성 검사: "총무" 또는 "명" 중 하나라도 포함되어야 함
        const hasLeader = promptText.includes('총무');
        const isSimpleSplit = promptText.includes('명'); // 예: 3명, 다섯명 등
        if (!hasLeader && !isSimpleSplit) {
            setValidationMessage(
                "누가 돈을 받아야 하나요? 이름 뒤에 '(총무)'를 붙여주세요!\n(예: 우혁(총무))\n\n💡 단순 N빵은 인원수만 적어도 돼요! (예: 3명이서 나눠줘)"
            );
            setShowValidationModal(true);
            return;
            }
        }

        const messageId = messages.length + 1;
        const timestamp = new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        });

        // Optimistic UI: 사용자 메시지 및 이미지 미리보기 추가
        if (files && files.length > 0) {
            files.forEach((file, index) => {
                const imageUrl = URL.createObjectURL(file);
                const imageMessage = {
                    id: `user-image-${Date.now()}-${index}`,
                    sender: 'user',
                    type: 'image',
                    imageUrl: imageUrl,
                    timestamp: timestamp,
                };
                setMessages((prev) => [...prev, imageMessage]);
            });
        }

        if (promptText) {
            const textMessage = {
                id: `user-text-${Date.now()}`,
                sender: 'user',
                type: 'text',
                text: promptText,
                timestamp: timestamp,
            };
            setMessages((prev) => [...prev, textMessage]);
        }

        setInputValue(''); // 입력창 초기화
        // 파일 초기화 트리거 (텍스트만 보내도 파일이 있으면 초기화)
        setClearFilesTrigger((prev) => prev + 1);

        // 텍스트 또는 이미지가 있으면 AI 분석 및 자동 생성 진행
        if (promptText || (files && files.length > 0)) {
            setIsLoading(true);
            // 로딩 말풍선이 바로 보이도록 스무스 스크롤
            setTimeout(() => {
                smoothScrollToBottom();
            }, 100);
            try {
                let webpFiles = [];
                
                // 이미지가 있으면 WebP로 변환
                if (files && files.length > 0) {
                    webpFiles = await Promise.all(
                        files.map((file) => transformToWebp(file))
                    );
                }

                // FormData 생성
                const formData = new FormData();
                
                // 이미지 파일들을 FormData에 추가
                if (webpFiles && webpFiles.length > 0) {
                    webpFiles.forEach((file) => {
                        formData.append('images', file);
                    });
                }

                // meetingId가 있으면 수정 모드, 없으면 생성 모드
                if (meetingId) {
                    // 수정 모드: modifyMeetingByAi 호출
                    const prompt = promptText || (files && files.length > 0 ? '이미지를 분석해주세요' : '');
                    await modifyMeetingByAi(meetingId, prompt);
                    
                    // 정산 다시 로드하여 최신 데이터 가져오기
                    const updatedMeeting = await getAiMeetingById(meetingId);
                    
                    // 사용자 메시지: 수정 요청 텍스트 (prompt가 있으면)
                    if (prompt && prompt.trim()) {
                        const userTextMessage = {
                            id: `user-text-${Date.now()}`,
                            sender: 'user',
                            type: 'text',
                            text: prompt,
                            timestamp: new Date().toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            }),
                        };
                        setMessages((prev) => [...prev, userTextMessage]);
                    }
                    
                    // AI 응답 메시지 추가
                    // 모든 payments의 데이터 수집
                    const payments = updatedMeeting?.payments || [];
                    
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

                    const aiData = {
                        meeting_name: updatedMeeting?.name || 'AI 정산',
                        date: updatedMeeting?.date || '',
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

                    const aiTextMessage = {
                        id: `ai-text-${Date.now()}`,
                        sender: 'ai',
                        type: 'text',
                        text: '수정했습니다.',
                        timestamp: new Date().toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                    };

                    const aiCardMessage = {
                        id: `ai-card-${Date.now()}`,
                        sender: 'ai',
                        type: 'draft_card',
                        aiData: aiData,
                        imageUrls: imageUrls,
                        isViewerMode: false,
                        uuid: updatedMeeting?.uuid, // uuid 전달
                        meetingId: meetingId, // meetingId 전달
                    };

                    setMessages((prev) => [...prev, aiTextMessage, aiCardMessage]);

                    // Amplitude 이벤트
                    sendEventToAmplitude('modify ai settlement', {
                        meeting_id: meetingId,
                        prompt: prompt,
                    });

                    // 이미지가 포함된 요청이 성공했으면 사용자 데이터 갱신 (사용량 업데이트)
                    if (files && files.length > 0 && onUserUpdate) {
                        onUserUpdate();
                    }
                } else {
                    // 생성 모드: analyzeAndCreateMeeting 호출
                    // 프롬프트 추가
                    if (text.trim()) {
                        formData.append('prompt', text.trim());
                    }

                    const result = await analyzeAndCreateMeeting(formData);

                    // 응답에서 meeting 객체 추출 (다양한 응답 구조 지원)
                    let newMeetingId = null;
                    let meetingData = null;

                    if (result?.meeting?.id) {
                        // Case 1: { meeting: { id, ... } }
                        newMeetingId = result.meeting.id;
                        meetingData = result.meeting;
                    } else if (result?.id) {
                        // Case 2: { id, ... } (직접 meeting 객체)
                        newMeetingId = result.id;
                        meetingData = result;
                    } else if (result?.data?.meeting?.id) {
                        // Case 3: { data: { meeting: { id, ... } } }
                        newMeetingId = result.data.meeting.id;
                        meetingData = result.data.meeting;
                    } else if (result?.data?.id) {
                        // Case 4: { data: { id, ... } }
                        newMeetingId = result.data.id;
                        meetingData = result.data;
                    }

                    if (newMeetingId) {
                        // Amplitude 이벤트
                        sendEventToAmplitude('create ai settlement', {
                            meeting_id: newMeetingId,
                            meeting_name: meetingData?.name || 'AI 정산',
                        });

                        // 이미지가 포함된 요청이 성공했으면 사용자 데이터 갱신 (사용량 업데이트)
                        if (files && files.length > 0 && onUserUpdate) {
                            onUserUpdate();
                        }

                        // 부모 컴포넌트에 생성 완료 알림 (URL 변경)
                        if (onSettlementCreated) {
                            onSettlementCreated(newMeetingId);
                        }
                    } else {
                        console.error('정산 생성 응답 구조:', result);
                        throw new Error('정산 생성 응답에 meeting 객체가 없습니다.');
                    }
                }
            } catch (error) {
                console.error('AI 정산 생성 실패:', error);
                console.error('에러 상세:', {
                    status: error?.response?.status,
                    statusText: error?.response?.statusText,
                    data: error?.response?.data,
                    message: error?.message,
                });
                
                // 에러 코드별 처리
                const errorStatus = error?.response?.status || error?.status;
                const errorData = error?.response?.data || error?.data || {};
                const errorMessage = errorData?.detail || errorData?.message || error?.message || '';
                const hasImages = files && files.length > 0;

                // 403 Forbidden: 개인 한도 초과
                // 또는 에러 메시지에 "5회", "한도", "횟수" 등의 키워드가 포함된 경우
                const isPersonalLimitError = 
                    (errorStatus === 403 && hasImages) ||
                    (hasImages && (
                        errorMessage.includes('5회') ||
                        errorMessage.includes('한도') ||
                        errorMessage.includes('횟수') ||
                        errorMessage.includes('이미지 분석')
                    ));

                if (isPersonalLimitError) {
                    console.log('🚨 개인 한도 초과 - 설문 모달 표시', {
                        errorStatus,
                        errorMessage,
                        hasImages,
                    });
                    setLimitModalType('personal');
                    setShowLimitModal(true);
                    // 사용자 데이터 갱신 (남은 횟수 업데이트)
                    if (onUserUpdate) {
                        onUserUpdate();
                    }
                }
                // 503 Service Unavailable: 서버 한도 초과
                else if (errorStatus === 503 && hasImages) {
                    console.log('🚨 서버 한도 초과 - 모달 표시');
                    setLimitModalType('server');
                    setShowLimitModal(true);
                }
                // 기타 에러
                else {
                    console.log('기타 에러:', errorStatus, hasImages);
                    const errorMessage = {
                        id: messages.length + (files?.length || 0) + 1,
                        sender: 'ai',
                        type: 'text',
                        text: hasImages
                            ? '이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.'
                            : '요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
                        timestamp: new Date().toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                    };
                    setMessages((prev) => [...prev, errorMessage]);
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleGuideClick = (text) => {
        setInputValue(text);
        // 입력창으로 포커스 이동 (선택사항)
        setTimeout(() => {
            const textarea = document.querySelector('textarea');
            if (textarea) {
                textarea.focus();
                textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    // InputArea의 파일 입력을 트리거하기 위한 ref
    const fileInputTriggerRef = useRef(null);
    const cameraInputTriggerRef = useRef(null);

    const handleUploadClick = () => {
        // InputArea의 갤러리 파일 입력을 트리거
        if (fileInputTriggerRef.current) {
            fileInputTriggerRef.current.click();
        }
    };

    const handleCameraClick = () => {
        // InputArea의 카메라 파일 입력을 트리거
        if (cameraInputTriggerRef.current) {
            cameraInputTriggerRef.current.click();
        }
    };

    const GUIDE_PROMPTS = [
        {
            title: '결제자가 다를 때',
            desc: '2차에서는 영희가 결제 했어',
            fullText: '철수(총무), 영희, 길동 먹었는데 2차에서는 영희가 결제 했어.',
        },
        {
            title: '특정 항목 제외',
            desc: '길동이는 술 안 마심',
            fullText: '철수 (총무), 영희, 길동이랑 먹었는데 길동이는 술을 안 마셨으니까 주류비는 빼고 계산해줘.',
        },
        {
            title: '단순 N빵',
            desc: '총액 1/N 하기',
            fullText: '5명이서 똑같이 나눠줘.',
        },
    ];

    // 일일 이미지 분석 횟수 관리
    // 백엔드에서 dailyImageAnalysisCount 필드를 반환하지 않을 수 있으므로
    // snake_case와 camelCase 모두 지원
    // 날짜가 바뀌었는지 확인하여 카운트 갱신
    const lastAiUsageDate = user?.lastAiUsageDate || user?.last_ai_usage_date;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    // 날짜가 다르면 카운트를 0으로 처리 (하루가 지났으므로)
    const isDateChanged = lastAiUsageDate && lastAiUsageDate !== today;
    const rawDailyImageAnalysisCount = 
        user?.dailyImageAnalysisCount ?? 
        user?.daily_image_analysis_count ?? 
        0;
    
    // 날짜가 바뀌었으면 카운트를 0으로, 아니면 백엔드에서 받은 값 사용
    const dailyImageAnalysisCount = isDateChanged ? 0 : rawDailyImageAnalysisCount;
    
    const maxDailyLimit = 5;
    const remainingCount = Math.max(0, maxDailyLimit - dailyImageAnalysisCount);
    const isLimitReached = dailyImageAnalysisCount >= maxDailyLimit;
    
    // 디버깅: 사용량 정보 확인
    useEffect(() => {
        if (user) {
            console.log('📊 ChatContainer - User:', {
                lastAiUsageDate,
                today,
                isDateChanged,
                rawDailyImageAnalysisCount,
                dailyImageAnalysisCount,
                remainingCount,
                isLimitReached,
            });
        }
    }, [user, lastAiUsageDate, today, isDateChanged, rawDailyImageAnalysisCount, dailyImageAnalysisCount, remainingCount, isLimitReached]);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* 메시지 리스트 영역 (Gemini 스타일: 중앙 정렬) */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto w-full relative pt-[60px] md:pt-0 pb-[200px] md:pb-0">
                {/* 로딩 오버레이 (흰 배경 + 상단 게이지바) - meetingId가 있고 로딩 중일 때 표시 */}
                {isLoading && meetingId && (
                    <>
                        <style>
                            {`
                                @keyframes loadingProgress {
                                    0% { width: 0%; }
                                    100% { width: 100%; }
                                }
                            `}
                        </style>
                        <div className="absolute inset-0 bg-white z-30 flex flex-col">
                            {/* 상단 게이지바 - 왼쪽에서 오른쪽으로 진행 (모바일에서도 보이도록 fixed로 상단 고정) */}
                            <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50 overflow-hidden">
                                <div 
                                    className="h-full bg-[#3182F6] transition-all duration-500 ease-out"
                                    style={{ 
                                        width: '100%',
                                        animation: 'loadingProgress 1.5s ease-out forwards',
                                    }}
                                />
                            </div>
                        </div>
                    </>
                )}
                {messages.length === 0 ? (
                    /* 환영 화면 (Toss Style) */
                    <div className="flex flex-col justify-center items-center w-full px-4 md:px-6 lg:px-8 py-8 min-h-full">
                        {/* 인사말 섹션 */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Sparkles
                                    size={24}
                                    className="text-[#3182F6]"
                                />
                                <h2 className="text-2xl md:text-3xl font-semibold text-[#191F28]">
                                    {userName ? `${userName}님, 안녕하세요!` : '게스트님, 안녕하세요!'}
                                </h2>
                            </div>
                            <p className="text-lg text-[#333D4B]">
                                무엇을 도와드릴까요?
                            </p>
                        </div>

                        {/* 메인 액션 (업로드) */}
                        <div className="w-full max-w-2xl mb-8">
                            {/* 모바일: 찍기 + 올리기 두 개 버튼 (가로 배치) */}
                            <div className="md:hidden">
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={handleCameraClick}
                                        disabled={isLimitReached}
                                        className={`flex-1 flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all active:scale-[0.98] group touch-manipulation ${
                                            isLimitReached
                                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                                                : 'bg-blue-50 border-blue-100 md:hover:border-blue-300 md:hover:shadow-md active:border-blue-300'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl transition-colors ${
                                            isLimitReached
                                                ? 'bg-gray-100'
                                                : 'bg-white md:group-hover:bg-blue-100'
                                        }`}>
                                            <Camera
                                                size={18}
                                                className={isLimitReached ? 'text-gray-400' : 'text-blue-600'}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <h3 className={`text-xs font-semibold mb-0.5 ${
                                                isLimitReached ? 'text-gray-400' : 'text-blue-600'
                                            }`}>
                                                영수증 · 결제내역
                                            </h3>
                                            <p className={`text-[10px] font-medium ${
                                                isLimitReached ? 'text-gray-400' : 'text-blue-500'
                                            }`}>
                                                찍기
                                            </p>
                                        </div>
                                    </button>
                                    <div className="flex-1 relative">
                                        <button
                                            onClick={handleUploadClick}
                                            disabled={isLimitReached}
                                            className={`w-full flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all active:scale-[0.98] group touch-manipulation ${
                                                isLimitReached
                                                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                                                    : 'bg-blue-50 border-blue-100 md:hover:border-blue-300 md:hover:shadow-md active:border-blue-300'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-xl transition-colors ${
                                                isLimitReached
                                                    ? 'bg-gray-100'
                                                    : 'bg-white md:group-hover:bg-blue-100'
                                            }`}>
                                                <Receipt
                                                    size={18}
                                                    className={isLimitReached ? 'text-gray-400' : 'text-blue-600'}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <h3 className={`text-xs font-semibold mb-0.5 ${
                                                    isLimitReached ? 'text-gray-400' : 'text-blue-600'
                                                }`}>
                                                    영수증 · 결제내역
                                                </h3>
                                                <p className={`text-[10px] font-medium ${
                                                    isLimitReached ? 'text-gray-400' : 'text-blue-500'
                                                }`}>
                                                    올리기
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                                <p className={`text-xs text-center ${
                                    isLimitReached ? 'text-gray-400' : 'text-blue-500'
                                }`}>
                                    {isLimitReached 
                                        ? '오늘 이미지 분석 횟수를 모두 사용했습니다' 
                                        : '이미지를 올리면 AI가 자동으로 분석해요'}
                                </p>
                                {/* AI 정산 설문 후킹 (횟수 다 썼을 때) */}
                                {isLimitReached && (
                                    <div className="mt-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                                        <p className="text-xs text-gray-700 mb-2 text-center">
                                            💬 AI 정산 서비스가 어떠셨나요?
                                        </p>
                                        <button
                                            onClick={() => {
                                                sendEventToAmplitude('click ai settlement survey from limit', {});
                                                window.open('https://forms.gle/YOUR_SURVEY_LINK', '_blank');
                                            }}
                                            className="w-full px-4 py-2 bg-[#3182F6] text-white rounded-lg text-sm font-semibold hover:bg-[#1E6FFF] transition-colors active:scale-95"
                                        >
                                            설문 참여하기
                                        </button>
                                    </div>
                                )}
                                {/* 남은 횟수 표시 */}
                                {user && !isLimitReached && (
                                    <div className={`mt-2 px-3 py-1.5 rounded-lg border text-xs ${
                                        remainingCount <= 3
                                            ? 'bg-orange-50 border-orange-200'
                                            : 'bg-blue-50 border-blue-200'
                                    }`}>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                remainingCount <= 3 ? 'bg-orange-500' : 'bg-blue-500'
                                            }`} />
                                            <span className={`font-medium ${
                                                remainingCount <= 3 ? 'text-orange-700' : 'text-blue-700'
                                            }`}>
                                                오늘 남은 이미지 분석 횟수
                                            </span>
                                            <span className={`font-bold ${
                                                remainingCount <= 3 ? 'text-orange-600' : 'text-blue-600'
                                            }`}>
                                                {remainingCount}
                                            </span>
                                            <span className={`font-medium ${
                                                remainingCount <= 3 ? 'text-orange-500' : 'text-blue-500'
                                            }`}>
                                                / {maxDailyLimit}회
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* 데스크탑: 올리기만 */}
                            <div className="hidden md:block relative">
                                <button
                                    onClick={handleUploadClick}
                                    disabled={isLimitReached}
                                    className={`w-full flex items-center gap-4 p-6 border-2 rounded-[20px] transition-all active:scale-[0.98] group touch-manipulation ${
                                        isLimitReached
                                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                                            : 'bg-blue-50 border-blue-100 md:hover:border-blue-300 md:hover:shadow-md active:border-blue-300'
                                    }`}
                                >
                                    <div className={`p-3 rounded-2xl transition-colors ${
                                        isLimitReached
                                            ? 'bg-gray-100'
                                            : 'bg-white md:group-hover:bg-blue-100'
                                    }`}>
                                        <Receipt
                                            size={24}
                                            className={isLimitReached ? 'text-gray-400' : 'text-blue-600'}
                                        />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-lg font-semibold mb-1 ${
                                                isLimitReached ? 'text-gray-400' : 'text-blue-600'
                                            }`}>
                                                영수증 · 결제내역 올리기
                                            </h3>
                                        </div>
                                        <p className={`text-sm ${
                                            isLimitReached ? 'text-gray-400' : 'text-blue-500'
                                        }`}>
                                            {isLimitReached 
                                                ? '오늘 이미지 분석 횟수를 모두 사용했습니다' 
                                                : '이미지를 올리면 AI가 자동으로 분석해요'}
                                        </p>
                                        {/* AI 정산 설문 후킹 (횟수 다 썼을 때) */}
                                        {isLimitReached && (
                                            <div className="mt-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                                                <p className="text-xs text-gray-700 mb-2 text-center">
                                                    💬 AI 정산 서비스가 어떠셨나요?
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        sendEventToAmplitude('click ai settlement survey from limit', {});
                                                        window.open('https://forms.gle/YOUR_SURVEY_LINK', '_blank');
                                                    }}
                                                    className="w-full px-4 py-2 bg-[#3182F6] text-white rounded-lg text-sm font-semibold hover:bg-[#1E6FFF] transition-colors active:scale-95"
                                                >
                                                    설문 참여하기
                                                </button>
                                            </div>
                                        )}
                                        {/* 남은 횟수 표시 */}
                                        {user && !isLimitReached && (
                                            <div className={`mt-2 px-3 py-1.5 rounded-lg border text-xs inline-flex items-center gap-1.5 ${
                                                remainingCount <= 3
                                                    ? 'bg-orange-50 border-orange-200'
                                                    : 'bg-blue-50 border-blue-200'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    remainingCount <= 3 ? 'bg-orange-500' : 'bg-blue-500'
                                                }`} />
                                                <span className={`font-medium ${
                                                    remainingCount <= 3 ? 'text-orange-700' : 'text-blue-700'
                                                }`}>
                                                    오늘 남은 이미지 분석 횟수
                                                </span>
                                                <span className={`font-bold ${
                                                    remainingCount <= 3 ? 'text-orange-600' : 'text-blue-600'
                                                }`}>
                                                    {remainingCount}
                                                </span>
                                                <span className={`font-medium ${
                                                    remainingCount <= 3 ? 'text-orange-500' : 'text-blue-500'
                                                }`}>
                                                    / {maxDailyLimit}회
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <Receipt
                                        size={20}
                                        className={isLimitReached ? 'text-gray-400 opacity-60' : 'text-blue-600 opacity-60'}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* 가이드 섹션 */}
                        <div className="w-full max-w-2xl">
                            <p className="text-sm text-[#8B95A1] mb-4 text-center">
                                이렇게 물어보세요 👇
                            </p>
                            
                            {/* 가이드 카드 그리드 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {GUIDE_PROMPTS.map((prompt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleGuideClick(prompt.fullText)}
                                        className="p-4 bg-white border border-[#E5E8EB] rounded-xl shadow-sm md:hover:border-blue-300 md:hover:shadow-md transition-all active:scale-[0.98] active:border-blue-300 text-left group touch-manipulation"
                                    >
                                        <h4 className="text-sm font-semibold text-[#191F28] mb-1">
                                            {prompt.title}
                                        </h4>
                                        <p className="text-xs text-[#8B95A1] line-clamp-2">
                                            {prompt.desc}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">
                        <MessageList 
                            messages={messages} 
                            isLoading={isLoading} 
                            user={user} 
                            onUserUpdate={onUserUpdate}
                            isModifyMode={!!meetingId}
                        />
                    </div>
                )}
            </div>

            {/* 입력 영역 - 모바일에서는 fixed로 하단 고정 */}
            <div className="md:relative fixed bottom-0 left-0 right-0 z-40 md:z-auto bg-white md:bg-transparent">
                <InputArea
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSendMessage}
                    showSuggestions={messages.length === 0}
                    isLoading={isLoading}
                    user={user}
                    onUserUpdate={onUserUpdate}
                    fileInputRef={fileInputTriggerRef}
                    cameraInputRef={cameraInputTriggerRef}
                    meetingId={meetingId}
                    clearFilesTrigger={clearFilesTrigger}
                    isModifyMode={!!meetingId}
                    isMeetingDataLoaded={!isLoading || !meetingId}
                />
            </div>

            {/* 입력 검증 모달 */}
            {showValidationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowValidationModal(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 animate-[fadeIn_0.2s_ease-out]">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            입력이 필요해요
                        </h3>
                        {validationMessage ? (
                            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                {validationMessage}
                            </div>
                        ) : (
                            "누가 돈을 받아야 하나요? 이름 뒤에 '(총무)'를 붙여주세요!\n(예: 우혁(총무))\n\n💡 단순 N빵은 인원수만 적어도 돼요! (예: 3명이서 나눠줘)"
                        )}
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setShowValidationModal(false)}
                                className="px-4 py-2.5 rounded-lg bg-[#3182F6] text-white text-sm font-semibold md:hover:bg-[#1E6FFF] active:scale-95 active:bg-[#1E6FFF] transition-all touch-manipulation min-h-[44px]"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI 분석 제한 모달 */}
            <AiAnalysisLimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                type={limitModalType}
                onSwitchToText={() => {
                    // 텍스트 모드로 전환 (이미지 제거, 입력창 포커스)
                    // 실제로는 이미지가 없으면 텍스트 모드이므로 별도 처리 불필요
                    // 모달만 닫으면 됨
                }}
            />
            
        </div>
    );
};

export default ChatContainer;

