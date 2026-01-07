import React from 'react';
import styled, { keyframes } from 'styled-components';

// 스피너 회전 애니메이션
const spin = keyframes`
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
`;

// 펄스 애니메이션
const pulse = keyframes`
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
`;

// 도트 바운스 애니메이션
const bounce = keyframes`
    0%, 80%, 100% {
        transform: scale(0);
    }
    40% {
        transform: scale(1);
    }
`;

// 메인 컨테이너
const LoadingContainer = styled.div.withConfig({
    shouldForwardProp: (prop) => prop !== 'fullScreen',
})`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: ${(props) => (props.fullScreen ? 'fixed' : 'absolute')};
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${(props) => (props.fullScreen ? '100vw' : 'auto')};
    height: ${(props) => (props.fullScreen ? '100vh' : 'auto')};
    background: ${(props) =>
        props.fullScreen ? 'rgba(255, 255, 255, 0.9)' : 'transparent'};
    z-index: ${(props) => (props.fullScreen ? '9999' : 'auto')};
    backdrop-filter: ${(props) => (props.fullScreen ? 'blur(2px)' : 'none')};
`;

// 원형 스피너
const CircularSpinner = styled.div`
    width: ${(props) => props.size || '48px'};
    height: ${(props) => props.size || '48px'};
    border: 4px solid #f3f4f6;
    border-top: 4px solid ${(props) => props.color || '#3182f6'};
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
`;

// 도트 스피너 컨테이너
const DotsContainer = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
`;

// 개별 도트
const Dot = styled.div`
    width: ${(props) =>
        props.size === 'small'
            ? '8px'
            : props.size === 'large'
              ? '16px'
              : '12px'};
    height: ${(props) =>
        props.size === 'small'
            ? '8px'
            : props.size === 'large'
              ? '16px'
              : '12px'};
    background: ${(props) => props.color || '#3182f6'};
    border-radius: 50%;
    animation: ${bounce} 1.4s ease-in-out infinite both;
    animation-delay: ${(props) => props.delay || '0s'};
`;

// 펄스 스피너
const PulseSpinner = styled.div`
    width: ${(props) => props.size || '48px'};
    height: ${(props) => props.size || '48px'};
    background: ${(props) => props.color || '#3182f6'};
    border-radius: 50%;
    animation: ${pulse} 1.5s ease-in-out infinite;
`;

// 로딩 텍스트
const LoadingText = styled.p`
    margin-top: 16px;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    letter-spacing: -0.2px;
`;

// 바 스피너
const BarsContainer = styled.div`
    display: flex;
    gap: 3px;
    align-items: end;
`;

const Bar = styled.div`
    width: 4px;
    height: ${(props) =>
        props.size === 'small'
            ? '20px'
            : props.size === 'large'
              ? '40px'
              : '30px'};
    background: ${(props) => props.color || '#3182f6'};
    border-radius: 2px;
    animation: ${keyframes`
        0%, 40%, 100% {
            transform: scaleY(0.4);
        }
        20% {
            transform: scaleY(1);
        }
    `} 1.2s infinite ease-in-out;
    animation-delay: ${(props) => props.delay || '0s'};
`;

const LoadingSpinner = ({
    type = 'circular',
    size = 'medium',
    color = '#3182f6',
    fullScreen = false,
    text = null,
}) => {
    const renderSpinner = () => {
        switch (type) {
            case 'dots':
                return (
                    <DotsContainer>
                        <Dot size={size} color={color} delay="0s" />
                        <Dot size={size} color={color} delay="0.16s" />
                        <Dot size={size} color={color} delay="0.32s" />
                    </DotsContainer>
                );
            case 'pulse':
                return <PulseSpinner size={getSizeValue(size)} color={color} />;
            case 'bars':
                return (
                    <BarsContainer>
                        <Bar size={size} color={color} delay="0s" />
                        <Bar size={size} color={color} delay="0.1s" />
                        <Bar size={size} color={color} delay="0.2s" />
                        <Bar size={size} color={color} delay="0.3s" />
                        <Bar size={size} color={color} delay="0.4s" />
                    </BarsContainer>
                );
            default:
                return (
                    <CircularSpinner size={getSizeValue(size)} color={color} />
                );
        }
    };

    const getSizeValue = (size) => {
        switch (size) {
            case 'small':
                return '32px';
            case 'large':
                return '64px';
            default:
                return '48px';
        }
    };

    return (
        <LoadingContainer fullScreen={fullScreen}>
            {renderSpinner()}
            {text && <LoadingText>{text}</LoadingText>}
        </LoadingContainer>
    );
};

export default LoadingSpinner;
