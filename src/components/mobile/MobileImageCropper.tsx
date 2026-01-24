import React, { useRef, useEffect, useState } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

interface MobileImageCropperProps {
    /** 크롭할 이미지 소스 (File 또는 URL) */
    imageSrc: string | File;
    /** 크롭 완료 시 호출되는 콜백 (Blob 형태로 결과 전달) */
    onCropComplete: (croppedBlob: Blob) => void;
    /** 취소 버튼 클릭 시 호출되는 콜백 */
    onCancel: () => void;
    /** 모달 열림 여부 */
    isOpen: boolean;
}

/**
 * 모바일 웹앱(PWA) 전용 이미지 크롭 컴포넌트
 * 
 * 토스 앱과 유사한 네이티브 앱 경험을 제공합니다.
 * - 터치 전용 인터페이스
 * - Safe Area 대응
 * - 배경 스크롤 잠금
 */
const MobileImageCropper: React.FC<MobileImageCropperProps> = ({
    imageSrc,
    onCropComplete,
    onCancel,
    isOpen,
}) => {
    const cropperRef = useRef<any>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // 이미지 소스를 URL로 변환
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setIsLoading(true);
        let url = '';

        if (imageSrc instanceof File) {
            url = URL.createObjectURL(imageSrc);
            setImageUrl(url);
            setIsLoading(false);
        } else if (typeof imageSrc === 'string') {
            setImageUrl(imageSrc);
            setIsLoading(false);
        }

        // 클린업: File 객체로 만든 URL은 메모리 누수 방지를 위해 해제
        return () => {
            if (imageSrc instanceof File && url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [imageSrc, isOpen]);

    // 배경 스크롤 잠금 처리
    useEffect(() => {
        if (isOpen) {
            // 모달이 열려있을 때 배경 스크롤 방지
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            return () => {
                // 모달이 닫힐 때 원래 상태로 복구
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    // 크롭 완료 핸들러
    const handleCropComplete = async () => {
        if (!cropperRef.current) {
            return;
        }

        try {
            const cropper = cropperRef.current.cropper;
            if (!cropper) {
                return;
            }

            // Canvas를 사용하여 크롭된 이미지를 Blob로 변환
            const canvas = cropper.getCroppedCanvas({
                width: 1024, // 최대 너비 (원하는 크기로 조정 가능)
                height: 1024, // 최대 높이 (원하는 크기로 조정 가능)
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 1,
            });

            if (!canvas) {
                console.error('Canvas를 생성할 수 없습니다.');
                return;
            }

            // Canvas를 Blob로 변환
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        onCropComplete(blob);
                    } else {
                        console.error('Blob 변환 실패');
                    }
                },
                'image/jpeg', // 또는 'image/png', 'image/webp' 등
                0.9 // 품질 (0.0 ~ 1.0)
            );
        } catch (error) {
            console.error('크롭 처리 중 오류:', error);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="h-[100dvh] w-full fixed inset-0 z-50 bg-white"
            style={{
                touchAction: 'none', // 터치 제스처 방지 및 드래그 시 브라우저 동작 방지
            }}
        >
            {/* Cropper 컨테이너 - 화면 중앙에 위치 */}
            <div className="h-full w-full flex items-center justify-center relative bg-gray-50">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full w-full">
                        <div className="w-12 h-12 border-4 border-[#1350fe] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <Cropper
                        ref={cropperRef}
                        src={imageUrl}
                        style={{
                            height: '100%',
                            width: '100%',
                        }}
                        aspectRatio={NaN} // 자유로운 비율 (직사각형 가능)
                        viewMode={1} // viewMode 1: 크롭 박스가 캔버스보다 작거나 같아야 함
                        dragMode="move" // 이미지를 드래그하여 이동
                        cropBoxMovable={true} // 크롭 박스 이동 가능 (카카오톡 스타일)
                        cropBoxResizable={true} // 크롭 박스 크기 조정 가능 (카카오톡 스타일)
                        guides={true} // 가이드 라인 표시 (3x3 그리드)
                        center={false} // 중앙 정렬 비활성화
                        background={true} // 배경 표시 (크롭 영역 외부 어둡게)
                        responsive={true} // 반응형
                        autoCropArea={0.8} // 자동 크롭 영역 설정 (80%)
                        restore={false} // 복구 기능 비활성화
                        zoomOnTouch={true} // 터치 줌 활성화
                        zoomOnWheel={false} // 휠일 줌 비활성화 (모바일 전용)
                        minCanvasWidth={0}
                        minCanvasHeight={0}
                        ready={() => {
                            // 크롭 박스 초기 크기 설정 (자유로운 비율)
                            if (cropperRef.current?.cropper) {
                                const cropper = cropperRef.current.cropper;
                                const containerData = cropper.getContainerData();
                                const cropBoxWidth = containerData.width * 0.8;
                                const cropBoxHeight = containerData.height * 0.8;
                                cropper.setCropBoxData({
                                    width: cropBoxWidth,
                                    height: cropBoxHeight,
                                });
                            }
                        }}
                    />
                )}
            </div>

            {/* 하단 컨트롤 바 - Safe Area 대응 */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-between px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]"
                style={{
                    paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`, // Safe Area 대응
                    minHeight: '88px',
                }}
            >
                {/* 취소 버튼 (좌측) */}
                <button
                    onClick={onCancel}
                    className="text-gray-600 text-base font-medium px-4 py-3 active:opacity-70 touch-manipulation"
                    style={{
                        WebkitTapHighlightColor: 'transparent', // iOS 터치 하이라이트 제거
                    }}
                >
                    취소
                </button>

                {/* 완료 버튼 (우측) - 토스 스타일: 파란색 배경 */}
                <button
                    onClick={handleCropComplete}
                    disabled={isLoading}
                    className="bg-[#1350fe] text-white text-base font-semibold px-6 py-3 rounded-xl active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] shadow-sm"
                    style={{
                        WebkitTapHighlightColor: 'transparent', // iOS 터치 하이라이트 제거
                    }}
                >
                    완료
                </button>
            </div>
        </div>
    );
};

export default MobileImageCropper;

