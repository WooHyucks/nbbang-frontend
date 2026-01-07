import React, { useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import styled from 'styled-components';
import Cookies from 'js-cookie';
import axios from 'axios';
import { LinkStyle } from '../Auth/AuthComponent.styled';

const AgreementModalContainer = styled.div`
    z-index: 10;
    position: absolute;
`;

const WrapperModal = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
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
    gap: 15px;
    padding: 20px;
    height: auto;
    width: auto;
    background: white;
    border-radius: 8px;
    transition: all 400ms ease-in-out;
    animation: fadeIn 400ms;
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;

const ModalClose = styled.button`
    cursor: pointer;
    margin-top: 10px;
    border: 1px solid lightgray;
    font-weight: 600;
    width: 150px;
    height: 40px;
    color: #0044fe;
    border-radius: 5px;
    background-color: white;
    box-shadow: 3px 4px 4px 0px #c6c6c666;
`;

const AgreementContainer = styled.form`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;
const AgreementChenckBox = styled.input`
    border-radius: 100%;
`;

const SignUpButton = styled.button`
    color: white;
    margin-top: 10px;
    border: 1px solid lightgray;
    font-weight: 600;
    width: 150px;
    height: 40px;
    border-radius: 5px;

    &:not(:disabled) {
        background-color: #0066ffd4;
        border: 1px solid lightgray;
        border-bottom: 1px solid #e1e1e1a8;
        box-shadow: 3px 4px 4px 0px #c6c6c666;
        color: white;
        cursor: pointer;
    }

    &:disabled {
        background-color: #d3d3d3;
        color: white;
    }
`;
const TextBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const TermsOfUseComment = styled.span`
    color: #949292;
    font-weight: 700;
`;

const CheckboxContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 5px 0px;
`;

const HiddenCheckbox = styled.input`
    border: 0;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    white-space: nowrap;
    width: 1px;
`;

const StyledCheckbox = styled.label`
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    border: 1px solid #ccc;
    display: inline-block;
    position: relative;
    cursor: pointer;
    margin-right: 8px;

    ${HiddenCheckbox}:checked + & {
        background: blue;
        border-color: blue;

        &::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
        }
    }
`;

const LabelText = styled.span`
    font-size: 16px;
    font-weight: 600;
    color: #333;
`;

const Agreement = ({ userData, navigate, apiUrl }) => {
    const [notAllow, setNotAllow] = useState(true);
    const [SginAgreement, setSginAgreement] = useState(false);
    useEffect(() => {
        if (SginAgreement) {
            setNotAllow(false);
            return;
        }
        setNotAllow(true);
    }, [SginAgreement]);

    const handleSingUp = async () => {
        userData.agreement = true;
        try {
            const response = await axios.post(apiUrl, userData);
            console.log(response);
            if (response.status === 201) {
                Cookies.set('authToken', response.data, {
                    expires: 30,
                    path: '/',
                    sameSite: 'Strict',
                    secure: window.location.protocol === 'https:',
                });
                navigate('/');
            } else {
                console.log('APi 서버로 전송하는 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.log('Api 데이터 보내기 실패');
        }
    };
    const cancel = () => {
        navigate('/');
    };

    return (
        <AgreementModalContainer>
            <WrapperModal>
                <Modal>
                    <AgreementContainer>
                        <TextBox>
                            <LinkStyle
                                to="/user-protocol"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                회원가입 이용약관
                            </LinkStyle>
                        </TextBox>
                        <TermsOfUseComment>
                            을 모두 확인하였으며, 이에 동의합니다.
                        </TermsOfUseComment>
                    </AgreementContainer>
                    <CheckboxContainer>
                        <HiddenCheckbox
                            type="checkbox"
                            id="custom-checkbox"
                            checked={SginAgreement}
                            onChange={(e) => setSginAgreement(e.target.checked)}
                        />
                        <StyledCheckbox htmlFor="custom-checkbox" />
                        <LabelText>동의합니다</LabelText>
                    </CheckboxContainer>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <SignUpButton
                            onClick={handleSingUp}
                            type="submit"
                            disabled={notAllow}
                        >
                            가입하기
                        </SignUpButton>
                        <ModalClose onClick={cancel}>취소</ModalClose>
                    </div>
                </Modal>
            </WrapperModal>
        </AgreementModalContainer>
    );
};

export default Agreement;
