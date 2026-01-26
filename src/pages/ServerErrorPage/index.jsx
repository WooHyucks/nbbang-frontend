import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 40px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    overflow: hidden;
`;

const BackgroundPattern = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;
    background-image: radial-gradient(circle, #ffffff 1px, transparent 1px);
    background-size: 50px 50px;
`;

const ErrorCard = styled(motion.div)`
    background: white;
    border-radius: 24px;
    padding: 48px 32px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    text-align: center;
    position: relative;
    z-index: 1;
`;

const ErrorCode = styled.h1`
    font-size: 120px;
    font-weight: 800;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    line-height: 1;
    letter-spacing: -4px;
`;

const ErrorTitle = styled.h2`
    font-size: 28px;
    font-weight: 700;
    color: #191f28;
    margin: 24px 0 12px 0;
    letter-spacing: -0.5px;
`;

const ErrorMessage = styled.p`
    font-size: 16px;
    color: #6b7684;
    line-height: 1.6;
    margin: 0 0 32px 0;
`;

const ButtonContainer = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
`;

const Button = styled(motion.button)`
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: -0.2px;
`;

const PrimaryButton = styled(Button)`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);

    &:hover {
        box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
        transform: translateY(-2px);
    }
`;

const SecondaryButton = styled(Button)`
    background: #f1f3f5;
    color: #495057;

    &:hover {
        background: #e9ecef;
        transform: translateY(-2px);
    }
`;

const IconContainer = styled.div`
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
`;

const shake = keyframes`
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
`;

const ErrorIcon = styled(motion.div)`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: white;
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.3);
`;

const ServerErrorPage = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <Container>
            <BackgroundPattern />
            <ErrorCard
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <IconContainer>
                    <ErrorIcon
                        animate={{
                            rotate: [0, -10, 10, -10, 10, 0],
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatDelay: 2,
                        }}
                    >
                        ⚠️
                    </ErrorIcon>
                </IconContainer>
                <ErrorCode>500</ErrorCode>
                <ErrorTitle>서버 오류가 발생했습니다</ErrorTitle>
                <ErrorMessage>
                    일시적인 문제로 서비스를 이용할 수 없습니다.
                    <br />
                    잠시 후 다시 시도해주세요.
                </ErrorMessage>
                <ButtonContainer>
                    <PrimaryButton
                        onClick={handleRetry}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        다시 시도
                    </PrimaryButton>
                    <SecondaryButton
                        onClick={handleGoHome}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        홈으로 가기
                    </SecondaryButton>
                </ButtonContainer>
            </ErrorCard>
        </Container>
    );
};

export default ServerErrorPage;
