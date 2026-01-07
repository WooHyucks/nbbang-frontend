import React from 'react';
import {
    SocialLoginContainer,
    Button,
    SocialLoginIcon,
} from './SocialLoginForm.styled';
import { sendEventToAmplitude } from '@/utils/amplitude';

export const SocialLoginForm = ({
    alt,
    src,
    comment,
    socialLoginUrl,
    type,
    buttonStyle,
    containerStyle,
    imgStyle,
}) => {
    const handleSocialLogin = () => {
        sendEventToAmplitude('click 3rd party sign in', {
            'provider type': type,
        });
        window.location.href = socialLoginUrl;
    };

    return (
        <SocialLoginContainer {...containerStyle} onClick={handleSocialLogin}>
            <SocialLoginIcon {...imgStyle} alt={alt} src={src} />
            <Button {...buttonStyle}>{comment}</Button>
        </SocialLoginContainer>
    );
};
