import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { GetMeetingNameData } from '../../api/api';
import BillingNameModal from '../Modal/BillingNameModal';

const BillngNameContainer = styled.header`
    max-width: 670px;
    position: sticky;
    top: 0;
    z-index: 10;
    background: white;
`;

const NavContainer = styled.div`
    background-color: white;
    height: 64px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
`;

const BackButton = styled.button`
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #191f28;
    font-size: 24px;
`;

const Title = styled.h1`
    font-size: 18px;
    font-weight: 600;
    color: #191f28;
    letter-spacing: -0.3px;
    margin: 0;
`;

const SettingsButton = styled.button`
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #191f28;
    font-size: 20px;
`;

const BillingName = ({ meetingName, setMeetingName }) => {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const [openModal, setOpenMenuModal] = useState(false);

    useEffect(() => {
        if (!openModal) {
            const handleGetData = async () => {
                try {
                    const responseGetData = await GetMeetingNameData(meetingId);
                    setMeetingName(responseGetData.data);
                } catch (error) {
                    console.log('Api 데이터 불러오기 실패');
                }
            };
            handleGetData();
        }
    }, [openModal]);

    const handleClick = () => {
        setOpenMenuModal(true);
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <BillngNameContainer>
            <NavContainer>
                <BackButton onClick={handleBack}>
                    <img src="/images/beck.png" alt="뒤로가기" width="18" />
                </BackButton>
                <Title>정산내역</Title>
                <SettingsButton onClick={handleClick}>
                    <img src="/images/Setting.png" alt="설정" width="18" />
                </SettingsButton>
                {openModal && (
                    <BillingNameModal
                        setOpenMenuModal={setOpenMenuModal}
                        MainMeetingId={meetingName?.id}
                        MainMeetingName={meetingName?.name}
                    />
                )}
            </NavContainer>
        </BillngNameContainer>
    );
};

export default BillingName;
