import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import AgreementModal from '../Modal/AgreementModal';
import { AmplitudeSetUserId, sendEventToAmplitude } from '@/utils/amplitude';
import RedirectPage from '../common/RedirectPage';

export const Redirect = ({ accessToken, apiUrl, navigate, type }) => {
    const [openModal, setOpenModal] = useState(false);
    const [userData, setUserData] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const RedirectAPI = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(apiUrl, { token: accessToken });
            if (response.status === 201) {
                Cookies.set('authToken', response.data, {
                    expires: 30,
                    path: '/',
                    sameSite: 'Strict',
                    secure: window.location.protocol === 'https:',
                });
                await AmplitudeSetUserId();
                sendEventToAmplitude('complete 3rd party sign in', {
                    'provider type': type,
                });
                navigate('/');
            } else if (response.status === 202) {
                setUserData(response.data);
                setOpenModal(true);
                setIsLoading(false);
            } else {
                setError('서버 응답 오류가 발생했습니다.');
                setIsLoading(false);
                console.log('APi 서버로 전송하는 중 오류가 발생했습니다.');
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    '로그인 처리 중 오류가 발생했습니다.',
            );
            setIsLoading(false);
            console.log('Api 데이터 보내기 실패', error);
        }
    };

    useEffect(() => {
        if (accessToken) {
            RedirectAPI();
        } else {
            setError('인증 토큰을 받아오지 못했습니다.');
            setIsLoading(false);
        }
    }, []);

    return (
        <>
            <RedirectPage type={type} isLoading={isLoading} error={error} />
            {openModal && (
                <AgreementModal
                    setOpenModal={setOpenModal}
                    userData={userData}
                    navigate={navigate}
                    apiUrl={apiUrl}
                />
            )}
        </>
    );
};
