import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styled from 'styled-components';
import { PutMeetingNameData } from '../../api/api';
import ToastPopUp from '../common/ToastPopUp';

const BillingNameModalContainer = styled.div`
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
    gap: 24px;
    width: 90%;
    max-width: 400px;
    background: white;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    animation: modalFadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1);
    padding: 32px 24px 24px;

    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const ModalTitle = styled.h2`
    font-size: 20px;
    font-weight: 700;
    color: #191f28;
    letter-spacing: -0.3px;
    margin: 0;
`;

const ModalClose = styled.button`
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 12px;
    background: #f8f9fa;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6c757d;
    font-size: 18px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
        background: #e9ecef;
        color: #495057;
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const FormContainer = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
`;

const InputGroup = styled.div`
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 8px;
`;

const Label = styled.label`
    font-size: 14px;
    font-weight: 600;
    color: #495057;
    letter-spacing: -0.2px;
`;

const BillingPixButton = styled.button`
    width: 100%;
    height: 48px;
    background: ${(props) =>
        props.disabled
            ? '#f8f9fa'
            : 'linear-gradient(135deg, #3182f6 0%, #1d4ed8 100%)'};
    color: ${(props) => (props.disabled ? '#adb5bd' : 'white')};
    border: ${(props) => (props.disabled ? '1px solid #dee2e6' : 'none')};
    border-radius: 16px;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.3px;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: ${(props) =>
        props.disabled ? 'none' : '0 4px 12px rgba(49, 130, 246, 0.2)'};

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(49, 130, 246, 0.3);
    }

    &:active:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(49, 130, 246, 0.2);
    }
`;

const CalendarContainer = styled.div`
    width: 100%;
    border-radius: 16px;
    border: 1px solid #dee2e6;
    background-color: white;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    @media (max-width: 480px) {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .react-calendar {
        width: 100%;
        border: none;
        font-family: inherit;
        background: white;
    }

    .react-calendar__navigation {
        display: flex;
        height: 48px;
        margin-bottom: 0;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
    }

    .react-calendar__navigation button {
        min-width: 44px;
        background: none;
        border: none;
        color: #495057;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            background: #e9ecef;
            color: #3182f6;
        }

        &:disabled {
            background: none;
            color: #adb5bd;
        }
    }

    .react-calendar__navigation__label {
        flex-grow: 1;
        font-weight: 700;
        font-size: 16px;
        color: #191f28;
    }

    .react-calendar__month-view__weekdays {
        text-align: center;
        text-transform: uppercase;
        font-weight: 600;
        font-size: 12px;
        color: #6c757d;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
    }

    .react-calendar__month-view__weekdays__weekday {
        padding: 12px 0;
    }

    .react-calendar__month-view__days__day {
        position: relative;
        padding: 12px 0;
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        background: none;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            background: #e3f2fd;
            color: #1976d2;
        }

        &--active {
            background: #3182f6 !important;
            color: white !important;
            font-weight: 700;
        }

        &--neighboringMonth {
            color: #adb5bd;
        }

        &--weekend {
            color: #dc3545;
        }

        @media (max-width: 480px) {
            padding: 8px 0;
            font-size: 13px;
            min-height: 36px;
        }
    }

    .react-calendar__tile {
        max-width: 100%;
        text-align: center;
        border: none;
        background: none;
    }

    .react-calendar__tile:enabled:hover,
    .react-calendar__tile:enabled:focus {
        background: #e3f2fd;
        color: #1976d2;
    }

    .react-calendar__tile--active {
        background: #3182f6;
        color: white;
    }

    .react-calendar__tile--now {
        background: #fff3cd;
        color: #856404;
        font-weight: 600;
    }

    .react-calendar__tile--now:enabled:hover,
    .react-calendar__tile--now:enabled:focus {
        background: #ffeaa7;
        color: #856404;
    }
`;

const InputBox = styled.div`
    width: 100%;
    height: 52px;
    border: 1px solid #dee2e6;
    border-radius: 16px;
    background-color: #f8f9fa;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;

    &:focus-within {
        border-color: #3182f6;
        background-color: white;
        box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
    }
`;

const Input = styled.input`
    border: none;
    background: transparent;
    width: 100%;
    padding: 0 16px;
    font-size: 16px;
    font-weight: 500;
    color: #191f28;
    letter-spacing: -0.2px;

    &::placeholder {
        color: #adb5bd;
        font-weight: 400;
    }

    &:focus {
        outline: none;
    }
`;

const BillingName = ({ setOpenMenuModal, MainMeetingId, MainMeetingName }) => {
    // 초기 날짜를 로컬 시간으로 설정
    const getInitialDate = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    };

    const [toastPopUp, setToastPopUp] = useState(false);
    const [formData, setFormData] = useState({
        name: MainMeetingName,
        date: getInitialDate(),
    });

    const { meetingId } = useParams();
    const [notAllow, setNotAllow] = useState(true);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handlePutData = async (e) => {
        e.preventDefault();
        try {
            if (MainMeetingId || meetingId) {
                // 날짜를 올바른 형식으로 변환 (YYYY-MM-DD)
                const formatDate = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };

                const dataToSend = {
                    ...formData,
                    date: formatDate(formData.date),
                };

                const response = await PutMeetingNameData(
                    MainMeetingId ? MainMeetingId : meetingId,
                    dataToSend,
                );
                if (response.status === 200) {
                    setFormData((prevData) => ({
                        ...prevData,
                        name: '',
                    }));
                    setOpenMenuModal(false);
                    setToastPopUp(true);
                }
            }
        } catch (error) {
            alert('모임명 수정에 실패했습니다');
            console.log('Api 데이터 수정 실패', error);
        }
    };

    useEffect(() => {
        setNotAllow(formData.name.length === 0);
    }, [formData.name]);

    return (
        <BillingNameModalContainer>
            <WrapperModal>
                <Modal>
                    <ModalHeader>
                        <ModalTitle>모임 정보 수정</ModalTitle>
                        <ModalClose onClick={() => setOpenMenuModal(false)}>
                            ×
                        </ModalClose>
                    </ModalHeader>

                    <FormContainer onSubmit={handlePutData}>
                        <InputGroup>
                            <Label>모임명</Label>
                            <InputBox>
                                <Input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="모임명을 입력해주세요"
                                    maxLength="22"
                                    autoComplete="off"
                                />
                            </InputBox>
                        </InputGroup>

                        <InputGroup>
                            <Label>모임 날짜</Label>
                            <CalendarContainer>
                                <Calendar
                                    value={formData.date}
                                    onChange={(date) => {
                                        // 시간대 문제를 해결하기 위해 로컬 시간으로 설정
                                        const localDate = new Date(
                                            date.getFullYear(),
                                            date.getMonth(),
                                            date.getDate(),
                                        );
                                        setFormData({
                                            ...formData,
                                            date: localDate,
                                        });
                                    }}
                                    locale="ko-KR"
                                    formatDay={(locale, date) => date.getDate()}
                                    formatShortWeekday={(locale, date) => {
                                        const weekdays = [
                                            '일',
                                            '월',
                                            '화',
                                            '수',
                                            '목',
                                            '금',
                                            '토',
                                        ];
                                        return weekdays[date.getDay()];
                                    }}
                                    showNeighboringMonth={false}
                                    calendarType="gregory"
                                    navigationLabel={({ date }) => {
                                        return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
                                    }}
                                />
                            </CalendarContainer>
                        </InputGroup>

                        <BillingPixButton disabled={notAllow}>
                            수정 완료
                        </BillingPixButton>
                    </FormContainer>
                </Modal>
            </WrapperModal>
            {toastPopUp && (
                <ToastPopUp
                    message="모임 정보가 수정되었습니다!"
                    setToastPopUp={setToastPopUp}
                />
            )}
        </BillingNameModalContainer>
    );
};

export default BillingName;
