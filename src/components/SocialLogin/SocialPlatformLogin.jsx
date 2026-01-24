import React from 'react';
import { SocialLoginForm } from './SocialLoginForm';

const KakaoLogin = () => {
    const kakaoClientId =
        import.meta.env.VITE_KAKAO_CLIENT_ID;
    const kakaoRedirectUri =
        import.meta.env.VITE_KAKAO_REDIRECT_URI ||
        'https://nbbang.shop/kakao-redirect';
    const kakaoProps = {
        alt: 'Kakao',
        src: '/images/kakao.png',
        type: 'kakao',
        comment: '카카오톡 로그인으로 시작하기',
        socialLoginUrl: `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${kakaoRedirectUri}&response_type=code`,
        containerStyle: {
            backgroundColor: '#FEE500',
            borderColor: '#FEE500',
        },
        imgStyle: {
            imgWidth: '22px',
        },

        buttonStyle: {
            textColor: 'black',
            backgroundColor: '#FEE500',
            borderColor: '#FEE500',
        },
    };

    return <SocialLoginForm {...kakaoProps} />;
};

const NaverLogin = () => {
    const naverClientId =
        import.meta.env.VITE_NAVER_CLIENT_ID;
    const naverRedirectUri =
        import.meta.env.VITE_NAVER_REDIRECT_URI ||
        'https://nbbang.shop/naver-redirect';
    const naverProps = {
        alt: 'Naver',
        type: 'naver',
        src: '/images/naver.png',
        comment: '네이버 로그인으로 시작하기',
        socialLoginUrl: `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${naverClientId}&redirect_uri=${naverRedirectUri}`,
        containerStyle: {},
        imgStyle: {
            imgWidth: '25px',
        },
        buttonStyle: {},
    };

    return <SocialLoginForm {...naverProps} />;
};

const GoogleLogin = () => {
    const googleClientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const googleRedirectUri =
        import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
        'https://nbbang.shop/google-redirect';
    const googleProps = {
        alt: 'google',
        typo: 'google',
        src: '/images/google.png',
        comment: '구글 로그인으로 시작하기',
        socialLoginUrl: `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&client_id=${googleClientId}&redirect_uri=${googleRedirectUri}`,
        containerStyle: {
            backgroundColor: 'white',
            gapSize: '38px',
        },
        imgStyle: {
            imgWidth: '15px',
        },

        buttonStyle: {
            textColor: 'black',
            backgroundColor: 'white',
            borderColor: 'white',
        },
    };

    return <SocialLoginForm {...googleProps} />;
};

export { KakaoLogin, NaverLogin, GoogleLogin };
