import React, { useState, useEffect } from 'react';
import { postSignInData } from '../../api/api';
import AuthComponent from './AuthComponent';
import { sendEventToAmplitude } from '@/utils/amplitude';

const SignIn = () => {
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });

    useEffect(() => {
        sendEventToAmplitude('view sign in', '');
    }, []);

    const additionalFields = [];

    return (
        <AuthComponent
            title="로그인"
            formData={formData}
            setFormData={setFormData}
            AuthApiRequest={postSignInData}
            additionalFields={additionalFields}
        />
    );
};

export default SignIn;
