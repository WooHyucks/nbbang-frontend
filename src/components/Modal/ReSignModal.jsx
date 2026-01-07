import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';
import styled from 'styled-components';
import Cookies from 'js-cookie';
import { deleteUser, Token } from '../../api/api';

const ReSignModalContainer = styled.div`
    z-index: 10;
    position: absolute;
`;

const WrapperModal = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Modal = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: left;
    gap: 20px;
    padding: 30px;
    width: 90%;
    max-width: 500px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    transition: all 400ms ease-in-out;
    animation: fadeIn 400ms;
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.8);
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
    font-size: 20px;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    color: #666;
    transition: color 0.2s;

    &:hover {
        color: #000;
    }
`;

const TextContainer = styled.div`
    width: 100%;
    padding: 0 20px;
`;

const ButtonContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 20px 0;
`;

const Text = styled.p`
    margin: 12px 0;
    line-height: 1.6;
    color: #333;
    font-size: 14px;
`;

const Button = styled.button`
    width: 200px;
    height: 45px;
    border: none;
    font-weight: 600;
    font-size: 15px;
    border-radius: 25px;
    transition: all 0.2s;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    &:not(:disabled) {
        background: linear-gradient(135deg, #0066ff 0%, #4895ff 100%);
        color: white;
        cursor: pointer;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }

        &:active {
            transform: translateY(0);
        }
    }

    &:disabled {
        background-color: #e0e0e0;
        color: #999;
    }
`;

const AgreementContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0;
`;

const Agreement = styled.input`
    width: 18px;
    height: 18px;
    cursor: pointer;
`;

const WarningTitle = styled.h3`
    color: #ff4444;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
`;

const ReSignModal = ({ secondSetOpenModal }) => {
    const navigate = useNavigate();
    const [ReSginAgreement, setReSginAgreement] = useState(false);
    const [notAllow, setNotAllow] = useState(true);

    const handleReSign = async () => {
        try {
            await deleteUser();
            Cookies.remove('authToken', { path: '/' });
            navigate('/signd');
        } catch (error) {
            console.log('Api 데이터 삭제 실패');
        }
    };

    useEffect(() => {
        if (ReSginAgreement) {
            setNotAllow(false);
        } else {
            setNotAllow(true);
        }
    }, [ReSginAgreement]);

    return (
        <ReSignModalContainer>
            <WrapperModal>
                <Modal>
                    <ModalClose onClick={() => secondSetOpenModal(false)}>
                        ×
                    </ModalClose>
                    <TextContainer>
                        <WarningTitle>회원탈퇴 안내</WarningTitle>
                        <Text style={{ fontWeight: 'bold' }}>
                            회원탈퇴 신청에 앞서 아래 사항에 대해 확인하시기
                            바랍니다.
                        </Text>
                        <Text style={{ fontWeight: 'bold', color: '#FF4444' }}>
                            탈퇴 후 회원 정보 및 제작한 앱은 모두 삭제 됩니다.
                        </Text>
                        <Text>
                            삭제되는 정산 관련 정보는 아래 항목을 확인해주시기
                            바랍니다. 탈퇴 후 해당 정보는 모두 삭제되어 이용할
                            수 없으며 복구가 불가능합니다.
                            <br />
                            <br />
                            • 회원 데이터
                            <br />
                            • 생성한 모임 데이터
                            <br />
                            • 모임의 멤버 데이터
                            <br />
                            • 모임의 결제내역 데이터
                            <br />• 공유된 정산결과 데이터
                        </Text>
                    </TextContainer>
                    <ButtonContainer>
                        <AgreementContainer>
                            <Agreement
                                type="checkbox"
                                checked={ReSginAgreement}
                                onChange={(e) =>
                                    setReSginAgreement(e.target.checked)
                                }
                            />
                            <span
                                style={{
                                    fontWeight: 'semibold',
                                    fontSize: '12px',
                                }}
                            >
                                안내 사항을 모두 확인하였으며, 이에 동의합니다.
                            </span>
                        </AgreementContainer>
                        <Button disabled={notAllow} onClick={handleReSign}>
                            회원탈퇴
                        </Button>
                    </ButtonContainer>
                </Modal>
            </WrapperModal>
        </ReSignModalContainer>
    );
};

export default ReSignModal;
