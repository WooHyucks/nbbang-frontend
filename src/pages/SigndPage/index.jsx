import React, { useEffect } from 'react';
import styled from 'styled-components';
import {
    NaverLogin,
    KakaoLogin,
    GoogleLogin,
} from '../../components/SocialLogin/SocialPlatformLogin';
import { Link, useNavigate } from 'react-router-dom';
import SigndLogo from '../../components/Auth/SigndLogo';
import { sendEventToAmplitude } from '@/utils/amplitude';
import { Token } from '../../api/api';

const SigndContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #fff;
    max-width: 450px;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    position: relative;
`;

const OAuthContainer = styled.div`
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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

const MainButton = styled.button`
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
`;

const SigndPage = () => {
    const navigate = useNavigate();
    const authToken = Token();
    const isGuestLoggedIn = !!authToken;

    useEffect(() => {
        sendEventToAmplitude('view sign in', '');
    }, []);

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
                {isGuestLoggedIn && (
                    <>
                        <MainButton onClick={handleGoToMain}>
                            메인으로 가기
                        </MainButton>
                        <Notice
                            style={{
                                marginTop: '5px',
                                marginBottom: '30px',
                                fontSize: '11px',
                            }}
                        >
                            게스트로 로그인되어 있습니다.
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
            <div className="flex justify-center w-full">
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
            </div>
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
