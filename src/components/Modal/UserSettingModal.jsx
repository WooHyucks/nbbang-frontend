import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Cookies from 'js-cookie';
import ReSignModal from './ReSignModal';

const UserSettingModalContainer = styled.div`
    z-index: 10;
    position: absolute;
    width: 100%;
`;

const WrapperModal = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 20px;
`;

const Modal = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 16px;
    min-height: 160px;
    width: 85%;
    max-width: 280px;
    background: white;
    border-radius: 20px;
    transition: all 300ms ease-in-out;
    animation: fadeIn 300ms;
    padding: 5px;

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;

const ModalClose = styled.button`
    cursor: pointer;
    position: absolute;
    font-size: 25px;
    top: 8px;
    right: 12px;
    background: none;
    border: none;
    padding: 8px;
    color: #666;
    transition: color 0.2s;

    &:hover {
        color: #333;
    }
`;

const Button = styled.div`
    cursor: pointer;
    background: ${(props) => (props.danger ? '#FFF0F0' : '#F5F7FF')};
    color: ${(props) => (props.danger ? '#FF4D4D' : '#3182F6')};
    border-radius: 12px;
    width: 100%;
    max-width: 180px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 15px;
    font-weight: 600;
    transition: all 0.2s;

    &:hover {
        background: ${(props) => (props.danger ? '#FFE5E5' : '#EEF2FF')};
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0px);
    }
`;

const SettingContainer = styled.form`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 12px;
    width: 100%;
`;

const UserSetting = ({ setUserSettingModal, user }) => {
    const navigate = useNavigate();
    const [openModal, secondSetOpenModal] = useState(false);
    const isGuest = user?.type === 'guest';

    const handleClick = () => {
        secondSetOpenModal(true);
    };

    const handleLogOut = () => {
        Cookies.remove('authToken', { path: '/' });
        navigate('/');
    };

    const handleLogin = () => {
        setUserSettingModal(false);
        navigate('/');
    };

    return (
        <UserSettingModalContainer>
            <WrapperModal>
                <Modal>
                    <ModalClose onClick={() => setUserSettingModal(false)}>
                        ×
                    </ModalClose>
                    <SettingContainer>
                        {isGuest ? (
                            <Button onClick={handleLogin}>
                                로그인 하러가기
                            </Button>
                        ) : (
                            <>
                                <Button onClick={handleLogOut}>로그아웃</Button>
                                <Button danger onClick={handleClick}>
                                    회원탈퇴
                                </Button>
                            </>
                        )}
                        {openModal && (
                            <ReSignModal
                                secondSetOpenModal={secondSetOpenModal}
                            />
                        )}
                    </SettingContainer>
                </Modal>
            </WrapperModal>
        </UserSettingModalContainer>
    );
};

export default UserSetting;
