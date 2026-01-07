import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { putPaymentData } from '../../api/api';
import useOnClickOutside from '../../hooks/useOnClickOutside';
import { truncate } from '../Meeting';

const PayMentFixContainer = styled.div`
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
    gap: 24px;
    width: 90%;
    max-width: 420px;
    background: white;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    padding: 32px 24px 24px;
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
    position: absolute;
    top: 16px;
    right: 16px;
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
    cursor: pointer;
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

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Label = styled.label`
    font-size: 14px;
    font-weight: 600;
    color: #495057;
    letter-spacing: -0.2px;
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

const PayMentFixInput = styled.input`
    width: 100%;
    background: transparent;
    border: none;
    padding: 0 16px;
    font-size: 16px;
    font-weight: 500;
    color: #191f28;
    letter-spacing: -0.2px;

    &:focus {
        outline: none;
    }

    &::placeholder {
        color: #adb5bd;
        font-weight: 400;
    }
`;

const PayMentFix = styled.button`
    width: 100%;
    height: 48px;
    background: linear-gradient(135deg, #3182f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.3px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(49, 130, 246, 0.3);

    &:hover {
        background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(49, 130, 246, 0.4);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(49, 130, 246, 0.3);
    }

    &:disabled {
        background: #adb5bd;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
`;

const SectionTitle = styled.h3`
    font-size: 16px;
    font-weight: 700;
    color: #191f28;
    letter-spacing: -0.3px;
    margin: 0 0 12px 0;
`;

const StyledCheckboxDiv = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
    margin-top: 12px;
`;

const StyledCheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    padding: 12px 8px;
    border-radius: 12px;
    background: ${(props) =>
        props.checked
            ? 'linear-gradient(135deg, #3182f6 0%, #1d4ed8 100%)'
            : '#f8f9fa'};
    border: 2px solid ${(props) => (props.checked ? '#3182f6' : '#dee2e6')};
    transition: all 0.2s ease;
    min-height: 44px;

    span {
        color: ${(props) => (props.checked ? 'white' : '#495057')};
        font-size: 13px;
        font-weight: ${(props) => (props.checked ? '600' : '500')};
        text-align: center;
        letter-spacing: -0.2px;
    }

    input[type='checkbox'] {
        position: absolute;
        opacity: 0;
    }

    &:hover {
        background: ${(props) =>
            props.checked
                ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'
                : '#e9ecef'};
        border-color: ${(props) => (props.checked ? '#1d4ed8' : '#adb5bd')};
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
`;

const SelectBox = styled.div`
    width: 100%;
    height: 52px;
    border: 1px solid #dee2e6;
    border-radius: 16px;
    background-color: #f8f9fa;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    position: relative;

    &:focus-within {
        border-color: #3182f6;
        background-color: white;
        box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
    }

    &::after {
        content: '▼';
        position: absolute;
        right: 16px;
        color: #6c757d;
        font-size: 12px;
        pointer-events: none;
    }
`;

const StyledSelect = styled.select`
    width: 100%;
    background: transparent;
    border: none;
    padding: 0 40px 0 16px;
    font-size: 16px;
    font-weight: 500;
    color: #191f28;
    letter-spacing: -0.2px;
    cursor: pointer;
    appearance: none;

    &:focus {
        outline: none;
    }

    option {
        padding: 8px;
        font-weight: 500;
    }
`;

const FormContainer = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
`;

const PaymentFix = ({
    id,
    meetingId,
    place,
    price,
    pay_member,
    attend_member_ids,
    member,
    setOpenModal,
    handleGetData,
}) => {
    const ref = useRef();

    // 스네이크 케이스로 받은 데이터를 사용
    const attendMemberIds = attend_member_ids || [];
    const payMember = pay_member || '';

    const initialMemberSelection = member.reduce((selection, memberdata) => {
        selection[memberdata.id] = (attendMemberIds || []).includes(
            memberdata.id,
        );
        return selection;
    }, {});
    const [memberSelection, setMemberSelection] = useState(
        initialMemberSelection,
    );

    const [selectedMember, setSelectedMember] = useState('');

    const [formData, setFormData] = useState({
        place: place,
        price: price,
        attend_member_ids: [],
        pay_member_id: null,
    });

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            attend_member_ids: Object.keys(memberSelection).filter(
                (key) => memberSelection[key],
            ),
            pay_member_id: selectedMember ? Number(selectedMember) : null,
        }));
    }, [memberSelection, selectedMember]);

    useEffect(() => {
        const payMemberId = member.find(
            (memberdata) => memberdata.name === payMember,
        )?.id;

        if (payMemberId !== undefined) {
            setSelectedMember(String(payMemberId));
        } else {
            setSelectedMember('');
        }
    }, [payMember, member]);

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
            // 서버로 보낼 때 스네이크 케이스로 변환
            const dataToSend = {
                place: formData.place,
                price: formData.price,
                attend_member_ids: formData.attend_member_ids,
                pay_member_id: formData.pay_member_id,
            };
            const response = await putPaymentData(meetingId, id, dataToSend);
            if (response.status === 200) {
                setFormData({
                    place: '',
                    price: '',
                    attend_member_ids: [],
                    pay_member_id: null,
                });
                setOpenModal(false);
                handleGetData();
            }
        } catch (error) {
            console.log('Api 데이터 수정 실패');
        }
    };

    useOnClickOutside(ref, () => {
        setOpenModal(false);
    });

    const handleMemberSelect = (e, memberId) => {
        const isChecked = e.target.checked;
        setMemberSelection((prevSelection) => ({
            ...prevSelection,
            [memberId]: isChecked,
        }));
    };

    const handleMemberDropBoxSelect = (e) => {
        const selectedValue = e.target.value;
        setSelectedMember(selectedValue);
    };

    return (
        <PayMentFixContainer>
            <WrapperModal>
                <Modal ref={ref}>
                    <ModalHeader>
                        <ModalTitle>결제 정보 수정</ModalTitle>
                        <ModalClose onClick={() => setOpenModal(false)}>
                            ×
                        </ModalClose>
                    </ModalHeader>

                    <FormContainer onSubmit={handlePutData}>
                        <InputGroup>
                            <Label>결제 내역</Label>
                            <InputBox>
                                <PayMentFixInput
                                    type="text"
                                    name="place"
                                    value={formData.place}
                                    placeholder="결제내역을 입력해주세요"
                                    onChange={handleInputChange}
                                    autoComplete="off"
                                />
                            </InputBox>
                        </InputGroup>

                        <InputGroup>
                            <Label>결제 금액</Label>
                            <InputBox>
                                <PayMentFixInput
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    placeholder="결제금액을 입력해주세요"
                                    onChange={handleInputChange}
                                    autoComplete="off"
                                />
                            </InputBox>
                        </InputGroup>

                        <InputGroup>
                            <Label>결제자 선택</Label>
                            <SelectBox>
                                <StyledSelect
                                    value={selectedMember || ''}
                                    onChange={handleMemberDropBoxSelect}
                                >
                                    {member.map((memberdata) => (
                                        <option
                                            key={memberdata.id}
                                            value={memberdata.id}
                                        >
                                            {memberdata.name}
                                        </option>
                                    ))}
                                </StyledSelect>
                            </SelectBox>
                        </InputGroup>

                        <InputGroup>
                            <Label>참여 멤버 선택</Label>
                            <StyledCheckboxDiv>
                                {member.map((memberdata) => (
                                    <StyledCheckboxLabel
                                        key={memberdata.id}
                                        checked={memberSelection[memberdata.id]}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={
                                                memberSelection[memberdata.id]
                                            }
                                            onChange={(e) =>
                                                handleMemberSelect(
                                                    e,
                                                    memberdata.id,
                                                )
                                            }
                                        />
                                        <span>
                                            {truncate(memberdata.name, 5)}
                                        </span>
                                    </StyledCheckboxLabel>
                                ))}
                            </StyledCheckboxDiv>
                        </InputGroup>

                        <PayMentFix type="submit">수정 완료</PayMentFix>
                    </FormContainer>
                </Modal>
            </WrapperModal>
        </PayMentFixContainer>
    );
};

export default PaymentFix;
