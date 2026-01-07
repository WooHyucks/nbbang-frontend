import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const Container = styled(motion.div)`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    text-align: center;
`;

const ContentCard = styled(motion.div)`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 48px 32px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
`;

const spin = keyframes`
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
`;

const Spinner = styled.div`
    width: 48px;
    height: 48px;
    border: 4px solid rgba(102, 126, 234, 0.2);
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
`;

const Title = styled.h1`
    font-size: 24px;
    font-weight: 700;
    color: #191f28;
    margin: 0;
    letter-spacing: -0.5px;
`;

const Message = styled.p`
    font-size: 16px;
    color: #6b7684;
    margin: 0;
    line-height: 1.6;
    letter-spacing: -0.2px;
`;

const ProviderBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    margin-top: 8px;
`;

const ErrorContainer = styled(motion.div)`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 24px;
`;

const ErrorIcon = styled.div`
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #ffebee;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
`;

const ErrorTitle = styled.h2`
    font-size: 20px;
    font-weight: 700;
    color: #d32f2f;
    margin: 0;
`;

const ErrorMessage = styled.p`
    font-size: 14px;
    color: #6b7684;
    margin: 0;
    line-height: 1.5;
`;

const getProviderName = (type) => {
    const names = {
        kakao: '카카오',
        naver: '네이버',
        google: '구글',
    };
    return names[type] || '소셜 로그인';
};

const getProviderEmoji = (type) => {
    const emojis = {
        kakao: '💬',
        naver: '🟢',
        google: '🔍',
    };
    return emojis[type] || '🔐';
};

const RedirectPage = ({ type, isLoading = true, error = null }) => {
    const providerName = getProviderName(type);
    const providerEmoji = getProviderEmoji(type);

    return (
        <Container
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <ContentCard
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.4, type: 'spring' }}
            >
                {error ? (
                    <ErrorContainer>
                        <ErrorIcon>⚠️</ErrorIcon>
                        <ErrorTitle>로그인 실패</ErrorTitle>
                        <ErrorMessage>
                            {error || '로그인 처리 중 오류가 발생했습니다.'}
                            <br />
                            잠시 후 다시 시도해주세요.
                        </ErrorMessage>
                    </ErrorContainer>
                ) : (
                    <>
                        <Spinner />
                        <div>
                            <Title>{providerName}로 로그인 중...</Title>
                            <Message>
                                잠시만 기다려주세요.
                                <br />
                                로그인을 처리하고 있습니다.
                            </Message>
                            <ProviderBadge>
                                <span>{providerEmoji}</span>
                                <span>{providerName}</span>
                            </ProviderBadge>
                        </div>
                    </>
                )}
            </ContentCard>
        </Container>
    );
};

export default RedirectPage;
