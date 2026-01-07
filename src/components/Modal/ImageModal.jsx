import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

// Styled Components
const ModalOverlay = styled(motion.div)`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
`;

const ModalContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const ImageContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
`;

const StyledImage = styled(motion.img)`
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    cursor: ${(props) => (props.isZoomed ? 'zoom-out' : 'zoom-in')};
    transform: scale(${(props) => (props.isZoomed ? props.zoomLevel : 1)});
    transition: transform 0.3s ease;
`;

const TopBar = styled.div`
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    z-index: 10;
`;

const CloseButton = styled.button`
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 20px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const ImageInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ImageCounter = styled.span`
    color: white;
    font-size: 14px;
    font-weight: 500;
`;

const ZoomButton = styled.button`
    width: 36px;
    height: 36px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

const NavigationButton = styled.button`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    ${(props) => (props.direction === 'prev' ? 'left: 20px;' : 'right: 20px;')}
    width: 50px;
    height: 50px;
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 20px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 10;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-50%) scale(1.1);
    }

    &:active {
        transform: translateY(-50%) scale(0.95);
    }

    @media (max-width: 768px) {
        width: 44px;
        height: 44px;
        font-size: 18px;
    }
`;

const BottomBar = styled.div`
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;
`;

const Indicator = styled.button.withConfig({
    shouldForwardProp: (prop) => prop !== 'active',
})`
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background: ${(props) =>
        props.active ? 'white' : 'rgba(255, 255, 255, 0.4)'};
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: ${(props) =>
            props.active ? 'white' : 'rgba(255, 255, 255, 0.6)'};
        transform: scale(1.2);
    }
`;

export const ImageModal = ({ images, isOpen, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [imageLoaded, setImageLoaded] = useState(false);
    const imageRef = useRef(null);

    // Reset states when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setIsZoomed(false);
            setZoomLevel(1);
            setImageLoaded(false);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    handlePrev();
                    break;
                case 'ArrowRight':
                    handleNext();
                    break;
                case ' ':
                    e.preventDefault();
                    handleZoomToggle();
                    break;
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex, isZoomed]);

    const handleNext = () => {
        if (images.length <= 1) return;
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsZoomed(false);
        setZoomLevel(1);
        setImageLoaded(false);
    };

    const handlePrev = () => {
        if (images.length <= 1) return;
        setCurrentIndex(
            (prevIndex) => (prevIndex - 1 + images.length) % images.length,
        );
        setIsZoomed(false);
        setZoomLevel(1);
        setImageLoaded(false);
    };

    const handleZoomToggle = () => {
        if (isZoomed) {
            setIsZoomed(false);
            setZoomLevel(1);
        } else {
            setIsZoomed(true);
            setZoomLevel(2);
        }
    };

    const handleImageClick = (e) => {
        e.stopPropagation();
        handleZoomToggle();
    };

    const handleIndicatorClick = (index) => {
        setCurrentIndex(index);
        setIsZoomed(false);
        setZoomLevel(1);
        setImageLoaded(false);
    };

    if (!isOpen || !images || images.length === 0) return null;

    return (
        <AnimatePresence>
            <ModalOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <ModalContainer onClick={(e) => e.stopPropagation()}>
                    <TopBar>
                        <ImageInfo>
                            <ImageCounter>
                                {currentIndex + 1} / {images.length}
                            </ImageCounter>
                            <ZoomButton onClick={handleZoomToggle}>
                                {isZoomed ? '🔍-' : '🔍+'}
                            </ZoomButton>
                        </ImageInfo>
                        <CloseButton onClick={onClose}>×</CloseButton>
                    </TopBar>

                    <ImageContainer>
                        <AnimatePresence mode="wait">
                            <StyledImage
                                key={currentIndex}
                                ref={imageRef}
                                src={`${import.meta.env.VITE_S3_BUCKET_URL || 'https://nbbang-receipt-images.s3.ap-northeast-2.amazonaws.com'}/${images[currentIndex]}`}
                                alt={`Image ${currentIndex + 1}`}
                                isZoomed={isZoomed}
                                zoomLevel={zoomLevel}
                                onClick={handleImageClick}
                                onLoad={() => setImageLoaded(true)}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{
                                    opacity: imageLoaded ? 1 : 0.5,
                                    scale: 1,
                                }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            />
                        </AnimatePresence>

                        {images.length > 1 && (
                            <>
                                <NavigationButton
                                    direction="prev"
                                    onClick={handlePrev}
                                >
                                    ‹
                                </NavigationButton>
                                <NavigationButton
                                    direction="next"
                                    onClick={handleNext}
                                >
                                    ›
                                </NavigationButton>
                            </>
                        )}
                    </ImageContainer>

                    {images.length > 1 && (
                        <BottomBar>
                            {images.map((_, index) => (
                                <Indicator
                                    key={index}
                                    active={index === currentIndex}
                                    onClick={() => handleIndicatorClick(index)}
                                />
                            ))}
                        </BottomBar>
                    )}
                </ModalContainer>
            </ModalOverlay>
        </AnimatePresence>
    );
};

const GalleryButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 1px solid #dee2e6;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 600;
    color: #495057;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    &:hover {
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &:active {
        transform: translateY(0);
    }
`;

const PhotoIcon = styled.span`
    font-size: 16px;
`;

const PhotoCount = styled.span`
    color: #3182f6;
    font-weight: 700;
`;

export const ImageGallery = ({ images }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!images || images.length === 0) return null;

    return (
        <div className="flex flex-col items-center justify-center">
            <GalleryButton onClick={() => setIsModalOpen(true)}>
                <PhotoIcon>📷</PhotoIcon>
                <span>사진</span>
                <PhotoCount>{images.length}장</PhotoCount>
            </GalleryButton>
            <ImageModal
                images={images}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};
