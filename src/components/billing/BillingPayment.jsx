import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
    getPaymentData,
    postPaymentData,
    deletePaymentData,
    putPaymentOrderData,
} from '../../api/api';
import BillingInputBox from '../common/BillingInputBox';
import PaymentFix from '../modal/PaymentFixModal';
import { truncate } from '../Meeting';
import Lottie from 'lottie-react';
import animationData from '../../assets/animations/card.json';
import { motion } from 'framer-motion';
import ToastPopUp from '../common/ToastPopUp';
import LoadingSpinner from '../common/LodingSpinner';
import { keyframes } from 'styled-components';

// @hello-pangea/dnd 관련 (react-beautiful-dnd의 React 18+ 호환 포크)
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ImageUploader from '../common/image/ImageUploader';

// =================== Styled Components =================== //

const BillingPaymentContainer = styled.section`
    padding: 0 16px;
    margin-top: 30px;
    flex-direction: column;
    display: ${(props) => (props.member ? 'flex' : 'none')};
    height: 100%;
    position: relative;
    animation: fadeOut 500ms;
    @keyframes fadeOut {
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

const FormContainer = styled.form`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
`;

const BillingAddPayment = styled.button`
    width: calc(100% - 32px);
    max-width: 760px;
    height: 48px;
    padding: 0 16px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    margin: 16px 0;
    transition: background-color 0.2s;
    border: none;
    background-color: #0066ff;
    color: white;
    cursor: pointer;

    &:hover {
        background-color: #1b64da;
    }

    &:disabled {
        background-color: #f2f4f6;
        color: #aeb5bc;
    }
`;

const PaymentList = styled(motion.div)`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 90%;
    max-width: 400px;
    margin: 12px auto;
    padding: 28px 24px;
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e8eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
`;

const DraggableContainer = styled.div`
    /* Draggable가 감싸는 최상위 컨테이너 */
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    margin-bottom: 12px;
`;

const DraggableHandle = styled.div`
    z-index: 10;
    top: 9%;
    left: 30%;
    position: absolute;
    width: 40%;
    height: 0px;
    background-color: #e5e8eb;
    border: 3px solid #fff;
    border-radius: 10px;
    padding: 3px;
`;

const PaymentContainers = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const Payment = styled.div.withConfig({
    shouldForwardProp: (prop) => prop !== 'isRight',
})`
    display: flex;
    flex-direction: column;
    align-items: ${(props) => (props.isRight ? 'flex-end' : 'flex-start')};
    gap: 8px;
    padding: 12px;
    border-radius: 12px;
    transition: all 0.2s;
    flex: 1;
`;

const PaymentPlace = styled.span`
    font-size: 18px;
    font-weight: 700;
    color: #191f28;
    margin-bottom: 4px;
`;

const PaymentPayer = styled.span`
    font-size: 15px;
    font-weight: 500;
    color: #4e5968;
    display: flex;
    align-items: center;
    gap: 4px;

    &::before {
        content: '결제자';
        font-size: 13px;
        color: #8b95a1;
    }
`;

const PaymentPrice = styled.span`
    font-size: 18px;
    font-weight: 700;
    color: black;
    text-align: right;
`;

const PaymentSplitPrice = styled.span`
    font-size: 15px;
    font-weight: 600;
    color: black;
    opacity: 0.8;
    text-align: right;

    &::before {
        content: '인당 ';
        font-size: 13px;
        color: #8b95a1;
    }
`;

const PaymentMembers = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 8px;
    margin-top: 4px;
    width: 100%;

    div {
        background: rgba(49, 130, 246, 0.06);
        border-radius: 10px;
        padding: 8px 14px;
        transition: all 0.2s;
    }

    span {
        font-size: 14px;
        font-weight: 600;
        color: #0066ff;
    }
`;

const PaymentDelete = styled.button`
    width: 28px;
    height: 28px;
    border-radius: 50%;
    position: absolute;
    top: 5px;
    right: 8px;
    border: none;
    background: #f2f4f6;
    color: #8b95a1;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const StyledCheckboxDiv = styled.div`
    display: grid;
    grid-template-columns: repeat(5, minmax(80px, 1fr));
    gap: 8px;
    width: 100%;
    @media (max-width: 500px) {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    }
`;

const StyledCheckboxLabel = styled.label`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 40px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    span {
        font-size: 14px;
        font-weight: 600;
        color: white;
        z-index: 1;
    }

    input[type='checkbox'] {
        position: absolute;
        width: 100%;
        height: 100%;
        appearance: none;
        border-radius: 8px;
        transition: all 0.2s;
        cursor: pointer;

        &:not(:checked) {
            background: #f2f4f6;
            border: 1px solid #e5e8eb;

            & + span {
                color: #4e5968;
            }
        }

        &:checked {
            background: #0066ff;
            border: none;
        }
    }
`;

const Title = styled.h2`
    text-align: left;
    font-size: 18px;
    font-weight: 800;
    color: #191f28;
`;

const BillingMemberTopLineComent = styled.h2`
    font-size: 14px;
    font-weight: 600;
    color: #191f28;
`;

const BillingMemberLineComent = styled(BillingMemberTopLineComent)``;

const BillingMembersComent = styled(BillingMemberTopLineComent)``;

const PaymentContainer = styled(BillingPaymentContainer)`
    display: ${(props) => (props.payment ? 'flex' : 'none')};
    width: auto;
    position: relative;
`;

const LottieContainer = styled.div`
    display: flex;
    justify-content: start;
    width: 60px;
    height: 60px;
`;

const PaymentLine = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    @media (max-width: 400px) {
    }
`;

const PaymentFixComent = styled.div`
    text-align: center;
    margin-top: 16px;
    padding: 12px;
    background: rgba(49, 130, 246, 0.04);
    border-radius: 12px;

    span {
        font-size: 13px;
        color: #0066ff;
        font-weight: 600;
    }
`;

const TitleContainer = styled.div`
    display: flex;
    justify-content: start;
    align-items: center;
    margin-bottom: 16px;
    margin-top: 16px;
`;

const SelectContainer = styled.div`
    width: 80px;
    display: flex;
    justify-content: center;
`;

const StyledSelect = styled.select`
    width: 100%;
    max-width: 480px;
    height: 42px;
    padding: 0 16px;
    border-radius: 12px;
    border: 1px solid #e5e8eb;
    font-size: 15px;
    font-weight: 500;
    color: #191f28;
    background-color: white;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238B95A1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    transition: all 0.2s;
`;

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 40px;
    margin: 20px 0px;
`;

// 스켈레톤 애니메이션
const shimmer = keyframes`
    0% {
        background-position: -1000px 0;
    }
    100% {
        background-position: 1000px 0;
    }
`;

const SkeletonBox = styled.div`
    background: linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px);
    background-size: 1000px 100%;
    animation: ${shimmer} 1.5s infinite;
    border-radius: 8px;
`;

const PaymentSkeletonCard = styled.div`
    width: 90%;
    max-width: 400px;
    margin: 12px auto;
    padding: 28px 24px;
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e8eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SkeletonRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
`;

const SkeletonText = styled(SkeletonBox)`
    height: ${(props) => props.height || '16px'};
    width: ${(props) => props.width || '60%'};
`;

const SkeletonCircle = styled(SkeletonBox)`
    width: ${(props) => props.size || '24px'};
    height: ${(props) => props.size || '24px'};
    border-radius: 50%;
`;

const PaymentUserContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

// =================== Component Start =================== //

const BillingPayment = ({ member, payment, setPayment, setIsLoading }) => {
    const { meetingId } = useParams();
    const [notAllow, setNotAllow] = useState(true);
    const [selectedMember, setSelectedMember] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [paymentSelected, setPayMentSelected] = useState({});
    const [toastPopUp, setToastPopUp] = useState(false);
    const [memberSelection, setMemberSelection] = useState({});
    const [isPaymentLoading, setIsPaymentLoading] = useState(true);

    const firstPayMemberId = useMemo(() => {
        return selectedMember ? Number(selectedMember) : null;
    }, [selectedMember]);

    // 결제 정보 입력 폼
    const [formData, setFormData] = useState({
        place: '',
        price: '',
        attend_member_ids: [],
        pay_member_id: null,
    });

    // 초기 멤버체크박스 true로 (모두 체크) 설정
    useEffect(() => {
        const updatedInitialMemberSelection = member.reduce(
            (selection, memberdata) => {
                selection[memberdata.id] = true;
                return selection;
            },
            {},
        );
        setMemberSelection(updatedInitialMemberSelection);
    }, [member]);

    // 폼데이터와 체크박스 연동
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            attend_member_ids: Object.keys(memberSelection).filter(
                (key) => memberSelection[key],
            ),
            pay_member_id: firstPayMemberId,
        }));
    }, [firstPayMemberId, memberSelection]);

    // 서버에서 결제 데이터 가져오기
    const handleGetData = async () => {
        setIsPaymentLoading(true);
        if (setIsLoading) setIsLoading(true);
        try {
            const responseGetData = await getPaymentData(meetingId);
            setPayment(responseGetData.data);
        } catch (error) {
            console.log('Api 데이터 불러오기 실패');
        } finally {
            setIsPaymentLoading(false);
            if (setIsLoading) setIsLoading(false);
        }
    };

    // 컴포넌트 최초 렌더 시 결제 데이터 가져오기
    useEffect(() => {
        handleGetData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meetingId]);

    // 결제 장소, 금액 입력 시 폼 업데이트
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // 결제 내역 추가
    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            // 결제자 ID가 없으면 selectedMember 또는 첫 번째 멤버 ID 사용
            const pay_member_id =
                formData.pay_member_id ||
                firstPayMemberId ||
                (member.length > 0 ? member[0].id : null);

            if (!pay_member_id) {
                alert('결제자를 선택해주세요.');
                return;
            }

            // 서버로 보낼 때 스네이크 케이스로 변환
            const dataToSend = {
                place: formData.place,
                price: formData.price,
                attend_member_ids: formData.attend_member_ids,
                pay_member_id: pay_member_id,
            };
            const responsePostData = await postPaymentData(
                meetingId,
                dataToSend,
            );
            if (responsePostData.status === 201) {
                setFormData({
                    place: '',
                    price: '',
                    attend_member_ids: Object.keys(memberSelection).filter(
                        (key) => memberSelection[key],
                    ),
                    pay_member_id: firstPayMemberId,
                });
                handleGetData();
            } else {
                setToastPopUp(true);
            }
        } catch (error) {
            console.log('Api 데이터 수정 실패');
        }
    };

    // 결제 내역 삭제
    const handleDeleteMember = async (paymentId) => {
        try {
            await deletePaymentData(meetingId, paymentId);
            setPayment(payment.filter((data) => data.id !== paymentId));
        } catch (error) {
            console.log('Api 데이터 삭제 실패');
        }
    };

    // 장소, 금액 둘 다 입력했을 때에만 "추가하기" 버튼 활성화
    useEffect(() => {
        if (formData.place.length > 0 && formData.price.length > 0) {
            setNotAllow(false);
        } else {
            setNotAllow(true);
        }
    }, [formData.place, formData.price]);

    // select에서 결제자 변경
    const handleMemberSelect = (e) => {
        const selectedValue = e.target.value;
        setSelectedMember(selectedValue);
    };

    // 체크박스에서 참석 멤버 변경
    const handleMemberCheckSelect = (e, memberId) => {
        const isChecked = e.target.checked;
        setMemberSelection((prevSelection) => ({
            ...prevSelection,
            [memberId]: isChecked,
        }));
    };

    // 멤버가 초기 로드되면 selectBox에서 첫 번째 멤버를 기본값으로
    useEffect(() => {
        if (member.length > 0 && !selectedMember) {
            handleMemberSelect({ target: { value: String(member[0].id) } });
        }
    }, [member]);

    // 수정 모달 열기
    const handleClick = (selectedMember) => {
        setPayMentSelected(selectedMember);
        setOpenModal(true);
    };

    // 결제내역 순서변경재정렬 유틸 함수 ---
    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const onDragEnd = (result) => {
        const { source, destination } = result;
        // 드롭할 위치가 없다면(리스트 밖으로 드래그) 그냥 종료
        if (!destination) return;

        // 같은 droppable 내에서 순서 변경할 경우
        if (source.droppableId === destination.droppableId) {
            const newPaymentList = reorder(
                payment,
                source.index,
                destination.index,
            );

            // 배열의 순서가 변경되었는지 확인
            const isOrderChanged = newPaymentList.some(
                (item, index) => item.id !== payment[index].id,
            );

            if (isOrderChanged) {
                setPayment(newPaymentList);

                const paymentIds = newPaymentList.map(
                    (paymentItem) => paymentItem.id,
                );
                putPaymentOrderData(meetingId, paymentIds);
            }
        }
    };

    const getItemStyle = (isDragging, draggableStyle) => {
        if (!draggableStyle?.transform) return draggableStyle;

        // 예: transform: translate(10px, 52px) 형태로 나오는 것을 파싱
        const regex = /translate\(([^)]+)\)/;
        const match = draggableStyle.transform.match(regex);

        if (!match) {
            return draggableStyle;
        }

        const [x, y] = match[1].split(',').map((val) => parseFloat(val));

        // x를 0으로, y는 원래 값 유지
        const lockedTransform = `translate(0px, ${y}px)`;

        return {
            ...draggableStyle,
            transform: lockedTransform,
        };
    };

    return (
        <>
            {/* ============ 결제 정보 등록 부분 ============ */}
            <BillingPaymentContainer
                member={member && member.length > 0 ? 'true' : undefined}
            >
                <ImageUploader meetingId={meetingId} meetingType={false} />
                <TitleContainer>
                    <Title>결제 내역을 추가 해주세요</Title>
                    <LottieContainer>
                        <Lottie
                            animationData={animationData}
                            loop={true}
                            autoplay={true}
                        />
                    </LottieContainer>
                </TitleContainer>
                <FormContainer onSubmit={handleAddMember}>
                    <InputContainer>
                        <BillingInputBox
                            type="text"
                            name="place"
                            value={formData.place}
                            onChange={handleInputChange}
                            placeholder="결제 장소를 입력해주세요"
                            autoComplete="off"
                            maxLength={22}
                        />
                        <BillingInputBox
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="결제 금액을 입력해주세요"
                            autoComplete="off"
                        />
                    </InputContainer>
                    <BillingMemberLineComent>
                        결제한 사람은 누구인가요?
                    </BillingMemberLineComent>
                    <SelectContainer>
                        <StyledSelect
                            value={selectedMember || ''}
                            onChange={handleMemberSelect}
                        >
                            {[
                                // 리더인 멤버가 목록 맨 위에 오도록 분리
                                ...member.filter((m) => m.leader === true),
                                ...member.filter((m) => m.leader === false),
                            ].map((memberdata) => (
                                <option
                                    key={memberdata.id}
                                    value={memberdata.id}
                                >
                                    {memberdata.name}
                                </option>
                            ))}
                        </StyledSelect>
                    </SelectContainer>
                    <BillingMembersComent>
                        참석한 멤버를 선택해주세요!
                    </BillingMembersComent>
                    <StyledCheckboxDiv>
                        {member.map((memberdata) => (
                            <div key={memberdata.id} style={{ margin: '5px' }}>
                                <StyledCheckboxLabel>
                                    <input
                                        type="checkbox"
                                        checked={
                                            memberSelection[memberdata.id] ||
                                            false
                                        }
                                        onChange={(e) =>
                                            handleMemberCheckSelect(
                                                e,
                                                memberdata.id,
                                            )
                                        }
                                    />
                                    <span>{truncate(memberdata.name, 4)}</span>
                                </StyledCheckboxLabel>
                            </div>
                        ))}
                    </StyledCheckboxDiv>
                    <BillingAddPayment type="submit" disabled={notAllow}>
                        결제내역 추가하기
                    </BillingAddPayment>
                </FormContainer>
            </BillingPaymentContainer>

            {/* ============ 결제 정보 리스트 & DnD 부분 ============ */}
            {isPaymentLoading ? (
                <PaymentContainer payment="true">
                    <PaymentLine>
                        {[1, 2, 3].map((i) => (
                            <PaymentSkeletonCard key={i}>
                                <SkeletonRow>
                                    <div style={{ flex: 1 }}>
                                        <SkeletonText
                                            height="20px"
                                            width="70%"
                                        />
                                        <SkeletonText
                                            height="14px"
                                            width="50%"
                                            style={{ marginTop: '8px' }}
                                        />
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <SkeletonText
                                            height="20px"
                                            width="80px"
                                        />
                                        <SkeletonText
                                            height="14px"
                                            width="60px"
                                            style={{ marginTop: '8px' }}
                                        />
                                    </div>
                                </SkeletonRow>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '8px',
                                        marginTop: '12px',
                                    }}
                                >
                                    <SkeletonCircle size="32px" />
                                    <SkeletonCircle size="32px" />
                                    <SkeletonCircle size="32px" />
                                </div>
                            </PaymentSkeletonCard>
                        ))}
                    </PaymentLine>
                </PaymentContainer>
            ) : (
                payment &&
                payment.length > 0 && (
                    <PaymentContainer payment="true">
                        <PaymentLine>
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable
                                    droppableId="droppable"
                                    direction="vertical"
                                >
                                    {(droppableProvided) => (
                                        <div
                                            ref={droppableProvided.innerRef}
                                            {...droppableProvided.droppableProps}
                                        >
                                            {payment && payment.length > 0
                                                ? payment.map(
                                                      (paymentdata, index) => (
                                                          <Draggable
                                                              key={
                                                                  paymentdata.id
                                                              }
                                                              draggableId={String(
                                                                  paymentdata.id,
                                                              )}
                                                              index={index}
                                                          >
                                                              {(
                                                                  draggableProvided,
                                                                  snapshot,
                                                              ) => (
                                                                  <DraggableContainer
                                                                      ref={
                                                                          draggableProvided.innerRef
                                                                      }
                                                                      {...draggableProvided.draggableProps}
                                                                      style={getItemStyle(
                                                                          snapshot.isDragging,
                                                                          draggableProvided
                                                                              .draggableProps
                                                                              .style,
                                                                      )}
                                                                  >
                                                                      {/* 드래그 핸들 파트 */}
                                                                      <DraggableHandle
                                                                          {...draggableProvided.dragHandleProps}
                                                                      />
                                                                      {/* 드래그 될 영역(실제 카드 부분) */}
                                                                      <PaymentList
                                                                          initial={{
                                                                              opacity: 1,
                                                                              scale: 1,
                                                                          }}
                                                                          animate={{
                                                                              opacity: 1,
                                                                              scale: 1,
                                                                          }}
                                                                          exit={{
                                                                              opacity: 0,
                                                                              scale: 0.9,
                                                                          }}
                                                                          transition={{
                                                                              duration: 0.3,
                                                                          }}
                                                                          onClick={() =>
                                                                              handleClick(
                                                                                  paymentdata,
                                                                              )
                                                                          }
                                                                      >
                                                                          <PaymentContainers>
                                                                              <PaymentUserContainer>
                                                                                  <Payment>
                                                                                      <PaymentPlace>
                                                                                          {truncate(
                                                                                              paymentdata.place,
                                                                                              9,
                                                                                          )}
                                                                                      </PaymentPlace>
                                                                                      <PaymentPayer>
                                                                                          {paymentdata.pay_member ||
                                                                                              ''}
                                                                                      </PaymentPayer>
                                                                                  </Payment>
                                                                                  <Payment
                                                                                      isRight
                                                                                  >
                                                                                      <PaymentPrice>
                                                                                          {paymentdata.price?.toLocaleString() ||
                                                                                              '0'}

                                                                                          원
                                                                                      </PaymentPrice>
                                                                                      <PaymentSplitPrice>
                                                                                          {paymentdata.split_price?.toLocaleString() ||
                                                                                              '0'}

                                                                                          원
                                                                                      </PaymentSplitPrice>
                                                                                  </Payment>
                                                                              </PaymentUserContainer>
                                                                              <PaymentMembers>
                                                                                  {paymentdata.attend_member &&
                                                                                  paymentdata
                                                                                      .attend_member
                                                                                      .length >
                                                                                      0
                                                                                      ? paymentdata.attend_member.map(
                                                                                            (
                                                                                                attendMemberdata,
                                                                                                i,
                                                                                            ) => (
                                                                                                <div
                                                                                                    key={
                                                                                                        i
                                                                                                    }
                                                                                                >
                                                                                                    <span>
                                                                                                        {truncate(
                                                                                                            attendMemberdata,
                                                                                                            4,
                                                                                                        )}
                                                                                                    </span>
                                                                                                </div>
                                                                                            ),
                                                                                        )
                                                                                      : null}
                                                                              </PaymentMembers>
                                                                          </PaymentContainers>
                                                                          <PaymentDelete
                                                                              onClick={(
                                                                                  e,
                                                                              ) => {
                                                                                  e.preventDefault();
                                                                                  e.stopPropagation(); // 모달 열리는 것 방지
                                                                                  handleDeleteMember(
                                                                                      paymentdata.id,
                                                                                  );
                                                                              }}
                                                                          >
                                                                              ×
                                                                          </PaymentDelete>
                                                                      </PaymentList>
                                                                  </DraggableContainer>
                                                              )}
                                                          </Draggable>
                                                      ),
                                                  )
                                                : null}
                                            {droppableProvided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                            <PaymentFixComent>
                                <span>
                                    결제 내역을 선택하면 수정이 가능해요!☝🏻
                                </span>
                            </PaymentFixComent>
                        </PaymentLine>
                    </PaymentContainer>
                )
            )}

            {/* ============ 결제 정보 수정 모달 ============ */}
            {openModal && (
                <PaymentFix
                    {...paymentSelected}
                    setOpenModal={setOpenModal}
                    memberSelection={Object.keys(memberSelection)}
                    member={member}
                    handleGetData={handleGetData}
                    selectedMember={selectedMember}
                    handleMemberSelect={handleMemberSelect}
                    meetingId={meetingId}
                />
            )}

            {/* ============ Toast 팝업 ============ */}
            {toastPopUp && (
                <ToastPopUp
                    message="입력 최대 값이 초과하였습니다."
                    setToastPopUp={setToastPopUp}
                />
            )}
        </>
    );
};

export default BillingPayment;
