import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Image as ImageIcon, Plane, Calculator, Users, X } from 'lucide-react';
import { PostSimpleSettlementData, postMeetingrData } from '../../api/api';
import { sendEventToAmplitude } from '@/utils/amplitude';
import AiAnalysisLimitModal from '../Modal/AiAnalysisLimitModal';
import { Skeleton } from '../ui/skeleton';
import MobileImageCropper from '../mobile/MobileImageCropper';

const QUICK_ACTIONS = [
    {
        label: '여행 정산 생성',
        icon: Plane,
        path: '/trip',
        style: 'bg-emerald-50 text-emerald-600 md:hover:bg-emerald-100',
        action: 'trip',
    },
    {
        label: '간편 정산 생성',
        icon: Calculator,
        path: '/simple-settlement', // 간편 정산은 API 호출 필요
        style: 'bg-orange-50 text-orange-600 md:hover:bg-orange-100',
        action: 'simple',
    },
    {
        label: '모임 정산 생성',
        icon: Users,
        path: '/meeting', // 일반 모임은 API 호출 필요
        style: 'bg-purple-50 text-purple-600 md:hover:bg-purple-100',
        action: 'meeting',
    },
];

const InputArea = ({ 
    value = '', 
    onChange, 
    onSend, 
    showSuggestions = false,
    isLoading = false,
    fileInputRef: externalFileInputRef,
    cameraInputRef: externalCameraInputRef,
    user = null,
    onUserUpdate = null,
    meetingId = null,
    clearFilesTrigger = 0,
    isModifyMode = false, // 수정 모드 여부
    isMeetingDataLoaded = true, // 미팅 데이터 로드 완료 여부
}) => {
    const navigate = useNavigate();
    const [creatingType, setCreatingType] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    
    // 모바일 이미지 크롭 관련 상태
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [cropperImageFile, setCropperImageFile] = useState(null);
    
    // 모바일 환경 감지
    const [isMobile, setIsMobile] = useState(false);
    
    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // 디버깅: 크롭 모달 상태 추적
    React.useEffect(() => {
        console.log('🔍 크롭 모달 상태:', {
            isCropperOpen,
            cropperImageFile: cropperImageFile ? cropperImageFile.name : null,
        });
    }, [isCropperOpen, cropperImageFile]);

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
    React.useEffect(() => {
        if (user) {
            console.log('📊 InputArea - User:', {
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

    const internalFileInputRef = useRef(null);
    const internalCameraInputRef = useRef(null);
    const fileInputRef = externalFileInputRef || internalFileInputRef;
    const cameraInputRef = externalCameraInputRef || internalCameraInputRef;

    // 외부 트리거값이 변경되면 선택된 파일 초기화
    React.useEffect(() => {
        if (clearFilesTrigger > 0) {
            setSelectedFiles([]);
        }
    }, [clearFilesTrigger]);

    const handleSend = () => {
        if ((value.trim() || selectedFiles.length > 0) && onSend) {
            onSend(value, selectedFiles);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageClick = () => {
        // 일반 파일 선택 (갤러리)
        const input = fileInputRef.current || internalFileInputRef.current;
        if (input) {
            input.click();
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const imageFiles = Array.from(files).filter((file) =>
                file.type.startsWith('image/')
            );
            
            if (imageFiles.length > 0) {
                // 모바일 환경에서만 단일 이미지 선택 시 크롭 모달 열기
                if (isMobile && imageFiles.length === 1) {
                    console.log('🖼️ 이미지 선택됨, 크롭 모달 열기:', imageFiles[0]);
                    setCropperImageFile(imageFiles[0]);
                    setIsCropperOpen(true);
                } else {
                    // PC 환경이거나 여러 이미지인 경우 기존 로직 사용
                    addFiles(imageFiles);
                }
            }
        }
        // input 초기화 (같은 파일 다시 선택 가능하도록)
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (cameraInputRef.current) {
            cameraInputRef.current.value = '';
        }
    };

    // 파일 추가 공통 로직
    const addFiles = (files) => {
        // 이미지 파일만 필터링
        const imageFiles = Array.from(files).filter((file) =>
            file.type.startsWith('image/')
        );
        if (imageFiles.length > 0) {
            // 최대 5개까지만 허용
            setSelectedFiles((prev) => {
                const newFiles = [...prev, ...imageFiles];
                return newFiles.slice(0, 5);
            });
        }
    };
    
    // Blob를 File로 변환하는 유틸리티 함수
    const blobToFile = (blob, fileName) => {
        return new File([blob], fileName, { type: blob.type });
    };
    
    // 크롭 완료 핸들러
    const handleCropComplete = (croppedBlob) => {
        if (cropperImageFile) {
            // 원본 파일 이름 사용하여 File 객체 생성
            const croppedFile = blobToFile(croppedBlob, cropperImageFile.name);
            // 크롭된 파일을 selectedFiles에 추가
            setSelectedFiles((prev) => {
                const newFiles = [...prev, croppedFile];
                return newFiles.slice(0, 5);
            });
        }
        // 크롭 모달 닫기
        setIsCropperOpen(false);
        setCropperImageFile(null);
    };
    
    // 크롭 취소 핸들러
    const handleCropCancel = () => {
        setIsCropperOpen(false);
        setCropperImageFile(null);
    };

    // 드래그 앤 드롭 핸들러
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // 드래그가 실제로 영역을 벗어났는지 확인
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) {
            addFiles(files);
        }
    };

    const handleRemoveFile = (index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleClear = () => {
        if (onChange) {
            onChange('');
        }
    };

    const handleQuickAction = async (action) => {
        switch (action) {
            case 'ai':
                // AI 모드는 현재 채팅창 유지
                break;
            case 'trip':
                navigate('/trip');
                break;
            case 'simple':
                // 간편 정산 생성
                setCreatingType('simple');
                try {
                    const responseSimple = await PostSimpleSettlementData();
                    if (responseSimple.status === 201) {
                        const locationHeader =
                            responseSimple.headers.location ||
                            responseSimple.headers['location'] ||
                            responseSimple.headers.Location;
                        if (locationHeader) {
                            const meetingId = locationHeader.split('/').pop();
                            sendEventToAmplitude('create new meeting', '');
                            navigate(`/simple-settlement/${meetingId}`);
                        }
                    }
                } catch (error) {
                    console.error('간편 정산 생성 실패:', error);
                } finally {
                    setCreatingType(null);
                }
                break;
            case 'meeting':
                // 일반 모임 정산 생성
                setCreatingType('meeting');
                try {
                    const responseMeeting = await postMeetingrData('meeting');
                    if (responseMeeting.status === 201) {
                        const locationHeader =
                            responseMeeting.headers.location ||
                            responseMeeting.headers['location'] ||
                            responseMeeting.headers.Location;
                        if (locationHeader) {
                            sendEventToAmplitude('create new simpleSettlement', '');
                            // location 헤더가 "meeting/123" 형태면 그대로 사용, 아니면 meetingId 추출
                            if (locationHeader.startsWith('meeting/')) {
                                navigate(`/${locationHeader}`);
                            } else {
                                const meetingId = locationHeader.split('/').pop();
                                navigate(`/meeting/${meetingId}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error('모임 정산 생성 실패:', error);
                } finally {
                    setCreatingType(null);
                }
                break;
            default:
                break;
        }
    };

    return (
        <div className="bg-white max-w-3xl mx-auto w-full">
            <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6">
                {/* 퀵 액션 칩 바 */}
                <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
                    {QUICK_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        const isActionCreating = creatingType === action.action;
                        return (
                            <button
                                key={action.label}
                                onClick={() => handleQuickAction(action.action)}
                                disabled={creatingType !== null || isLoading}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${action.style}`}
                            >
                                <Icon size={14} />
                                <span>{isActionCreating ? '생성 중...' : action.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* 파일 미리보기 */}
                {selectedFiles.length > 0 && (
                    <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                        {selectedFiles.map((file, index) => {
                            const imageUrl = URL.createObjectURL(file);
                            return (
                                <div
                                    key={index}
                                    className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-[#E5E8EB]"
                                >
                                    <img
                                        src={imageUrl}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => handleRemoveFile(index)}
                                        className="absolute top-1 right-1 p-1.5 bg-black/50 md:hover:bg-black/70 rounded-full transition-colors active:bg-black/70 touch-manipulation"
                                        aria-label="파일 제거"
                                    >
                                        <X size={12} className="text-white" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}


                {/* 입력 필드 */}
                <div
                    className="relative"
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div
                        className={`relative transition-all ${
                            isDragging
                                ? 'ring-2 ring-[#3182F6] ring-offset-2 bg-blue-50/50 rounded-[20px]'
                                : ''
                        }`}
                    >
                        {/* 숨겨진 파일 입력 (갤러리용) */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {/* 숨겨진 파일 입력 (카메라용) */}
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <textarea
                            value={value}
                            onChange={(e) => onChange && onChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={
                                isDragging
                                    ? '이미지를 여기에 놓으세요'
                                    : isModifyMode
                                        ? '수정할 내용을 말해주세요. (예: 소주는 철수 빼줘, 2차는 우혁이가 샀어)'
                                        : showSuggestions
                                            ? '영수증을 올리거나 텍스트로 입력하세요. (예: 우혁(총무), 준영, 상영이 만선호프에서 5만원 씀)'
                                            : '영수증을 올리거나 텍스트로 입력하세요. (예: 우혁(총무), 준영, 상영이 만선호프에서 5만원 씀)'
                            }
                            className="w-full h-[100px] min-h-[56px] md:min-h-[64px] px-4 py-3 md:px-6 md:py-4 bg-[#F9FAFB] border-0 rounded-[20px] resize-none focus:outline-none focus:ring-2 focus:ring-[#3182F6] text-sm md:text-base text-[#191F28] placeholder-[#8B95A1]"
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            {/* 텍스트 지우기 버튼 (텍스트가 있을 때만 표시) */}
                            {value.trim() && (
                                <button
                                    onClick={handleClear}
                                    className="p-2.5 text-[#8B95A1] md:hover:text-[#333D4B] md:hover:bg-[#F2F4F6] rounded-xl transition-colors active:scale-95 active:bg-[#F2F4F6] touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="텍스트 지우기"
                                    disabled={isLoading}
                                >
                                    <X size={18} />
                                </button>
                            )}
                            <div className="relative">
                                <button
                                    onClick={handleImageClick}
                                    className={`p-2.5 rounded-xl transition-colors active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
                                        isLimitReached
                                            ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                                            : 'text-[#8B95A1] md:hover:text-[#333D4B] md:hover:bg-[#F2F4F6] active:bg-[#F2F4F6]'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    aria-label="이미지 업로드"
                                    disabled={isLoading || isLimitReached}
                                    title={isLimitReached ? '오늘 이미지 분석 횟수를 모두 사용했습니다' : '이미지 업로드'}
                                >
                                    <ImageIcon size={18} />
                                </button>
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={(!value.trim() && selectedFiles.length === 0) || isLoading}
                                className="p-2.5 bg-[#3182F6] text-white rounded-full md:hover:bg-[#1B64DA] transition-all active:scale-95 active:bg-[#1B64DA] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label="메시지 전송"
                            >
                                {isLoading ? (
                                    <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI 정산 평가 모달 */}
            <AiAnalysisLimitModal
                isOpen={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
                type="personal"
                onSwitchToText={() => {
                    // 모달만 닫으면 됨
                }}
            />
            
            {/* 모바일 이미지 크롭 모달 */}
            {cropperImageFile && (
                <MobileImageCropper
                    imageSrc={cropperImageFile}
                    isOpen={isCropperOpen}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </div>
    );
};

export default InputArea;

