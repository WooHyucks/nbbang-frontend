import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Meeting from '../../components/Meeting';
import { getUserData, Token, postGuestLogin } from '../../api/api';
import Cookies from 'js-cookie';
import { sendEventToAmplitude, AmplitudeSetUserId } from '@/utils/amplitude';

const Container = styled.main`
    width: 100%;
    margin: auto;
`;

const MainPage = () => {
    const navigate = useNavigate();
    const authToken = Token();
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (!authToken) {
            navigate('/signd');
        }
    }, [authToken, navigate]);

    useEffect(() => {
        fetchData();
        sendEventToAmplitude('view meeting page', '');
    }, []);

    const fetchData = async () => {
        try {
            const response = await getUserData('user');
            setUser(response.data);
        } catch (error) {
            // 401 (Unauthorized)일 때만 토큰 제거
            if (error.response && error.response.status === 401) {
                Cookies.remove('authToken', { path: '/' });
                navigate('/signd');
            }
        }
    };

    return (
        <Container>
            <Meeting user={user} />
        </Container>
    );
};

export default MainPage;
