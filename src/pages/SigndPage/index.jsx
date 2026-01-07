import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
    NaverLogin,
    KakaoLogin,
    GoogleLogin,
} from '../../components/SocialLogin/SocialPlatformLogin';
import { Link, useNavigate } from 'react-router-dom';
import SigndLogo from '../../components/auth/SigndLogo';
import { sendEventToAmplitude, AmplitudeSetUserId } from '@/utils/amplitude';
import { postGuestLogin, Token } from '../../api/api';
import Cookies from 'js-cookie';

const SigndContainer = styled.div`
    display: inline-block;
    position: relative;
`;

const OAuthContainer = styled.div`
    margin-top: 40px;
`;

const SigndLineComent = styled.p`
    margin: 30px 0px;
    font-size: 14px;
    color: silver;
    font-weight: 700;
`;

const SingnUpLink = styled(Link)`
    display: inline-block;
    border-radius: 10px;
    width: 340px;
    height: 45px;
    border: 1px solid #e5e7eb;
    text-align: center;
    align-content: center;
`;

const SingnInLink = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
`;

const Notice = styled.p`
    font-size: 12px;
    font-weight: 600;
    color: #9ca3af;
`;

const GuestLoginButton = styled.button`
    display: inline-block;
    border-radius: 10px;
    width: 340px;
    height: 45px;
    border: 1px solid #e5e7eb;
    background: white;
    text-align: center;
    align-content: center;
    cursor: pointer;
    font-weight: bold;
    font-size: 13px;
    color: #3182f6;
    transition: all 0.2s ease;
    margin-bottom: 10px;

    &:hover {
        background: #f8f9fa;
        border-color: #3182f6;
    }

    &:active {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const SigndPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const authToken = Token();
    const isGuestLoggedIn = !!authToken;

    useEffect(() => {
        sendEventToAmplitude('view sign in', '');
    }, []);

    const handleGuestLogin = async () => {
        setIsLoading(true);
        sendEventToAmplitude('click guest login', '');
        try {
            const response = await postGuestLogin();
            if (response.status === 201) {
                const token = response.data;
                if (token) {
                    Cookies.set('authToken', token, {
                        expires: 36500, // 약 100년 (영구적으로 저장)
                        path: '/',
                        sameSite: 'Strict',
                        secure: window.location.protocol === 'https:',
                    });
                    await AmplitudeSetUserId();
                    sendEventToAmplitude('complete guest login', '');
                    navigate('/', { replace: true });
                } else {
                    console.error('토큰이 응답에 없습니다.');
                    setIsLoading(false);
                }
            } else {
                console.error('예상치 못한 응답 상태:', response.status);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('게스트 로그인 실패:', error);
            setIsLoading(false);
        }
    };

    const handleGoToMain = () => {
        navigate('/', { replace: true });
    };

    return (
        <SigndContainer>
            <SigndLogo />
            <Notice>
                회원님의 개인정보 보호를 위해 가입 시 이름 정보만 저장됩니다.
            </Notice>
            <OAuthContainer>
                {isGuestLoggedIn ? (
                    <>
                        <GuestLoginButton
                            onClick={handleGoToMain}
                            disabled={isLoading}
                        >
                            메인으로 가기
                        </GuestLoginButton>
                        <Notice
                            style={{
                                marginTop: '5px',
                                marginBottom: '30px',
                                fontSize: '11px',
                            }}
                        >
                            게스트로 로그인되어 있습니다.
                            <br />
                            계정을 만들어 데이터를 저장할 수 있어요.
                        </Notice>
                    </>
                ) : (
                    <>
                        <GuestLoginButton
                            onClick={handleGuestLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? '로그인 중...' : '게스트로 시작하기'}
                        </GuestLoginButton>
                        <Notice
                            style={{
                                marginTop: '5px',
                                marginBottom: '30px',
                                fontSize: '11px',
                            }}
                        >
                            게스트로 시작하면 로그인 없이 바로 사용할 수
                            있습니다.
                            <br />
                            나중에 계정을 만들어 데이터를 저장할 수 있어요.
                        </Notice>
                    </>
                )}
                <KakaoLogin />
                <NaverLogin />
                {navigator.userAgent.includes('KAKAOTALK') ? null : (
                    <GoogleLogin />
                )}
            </OAuthContainer>
            <SigndLineComent>또는</SigndLineComent>
            <SingnUpLink
                to="/sign-up"
                style={{
                    textDecoration: 'none',
                    color: 'black',
                    fontWeight: 'bold',
                    fontSize: '13px',
                }}
            >
                아이디로 가입하기
            </SingnUpLink>
            <SingnInLink>
                <SigndLineComent>이미 아이디가 있으신가요?</SigndLineComent>
                <Link
                    to="/sign-in"
                    style={{
                        textDecoration: 'none',
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: '13px',
                    }}
                >
                    로그인하기
                </Link>
            </SingnInLink>
        </SigndContainer>
    );
};

export default SigndPage;
