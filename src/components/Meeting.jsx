import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserSettingModal from './Modal/UserSettingModal';
import styled, { keyframes } from 'styled-components';
import {
    getMeetingData,
    postMeetingrData,
    deleteMeetingData,
    PostSimpleSettlementData,
} from '../api/api';
import BillingNameModal from './Modal/BillingNameModal';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineEdit } from 'react-icons/ai';
import { RiDeleteBinLine } from 'react-icons/ri';
import { Plus, Users, Zap, Plane } from 'lucide-react';
import { sendEventToAmplitude } from '@/utils/amplitude';
import LoadingSpinner from './common/LodingSpinner';

const Container = styled.div`
    padding: 0 20px;
    height: 100vh;
    background: #ffffff;
    position: relative;
    display: flex;
    flex-direction: column;
`;

const Header = styled(motion.header)`
    padding: 20px 0 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #ffffff;
    position: sticky;
    top: 0;
    z-index: 10;
`;

const HeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const UserName = styled(motion.h1)`
    font-size: 20px;
    font-weight: 700;
    color: #191f28;
    letter-spacing: -0.3px;
`;

const SettingButton = styled(motion.button)`
    width: 48px;
    height: 48px;
    border-radius: 16px;
    border: none;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #ffffff;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
`;

const FilterTabs = styled.div`
    display: flex;
    gap: 8px;
    padding-bottom: 15px;
    overflow-x: auto;
    &::-webkit-scrollbar {
        display: none;
    }
`;

const FilterTab = styled(motion.button).withConfig({
    shouldForwardProp: (prop) => prop !== 'active',
})`
    padding: 10px 16px;
    border-radius: 12px;
    border: none;
    background: ${(props) => (props.active ? '#3182f6' : '#f1f3f5')};
    color: ${(props) => (props.active ? '#ffffff' : '#6b7684')};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover {
        background: ${(props) => (props.active ? '#2870ea' : '#e9ecef')};
    }

    &:active {
        transform: scale(0.98);
    }
`;

const FilterCount = styled.span.withConfig({
    shouldForwardProp: (prop) => prop !== 'active',
})`
    background: ${(props) =>
        props.active ? 'rgba(255,255,255,0.2)' : '#dee2e6'};
    color: ${(props) => (props.active ? '#ffffff' : '#495057')};
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
`;

const MeetingList = styled(motion.div)`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    gap: 8px;
    margin-top: 10px;
    @media (max-width: 767px) {
        margin-bottom: 80px;
    }
    &::-webkit-scrollbar {
        display: none;
    }
`;

const MeetingCard = styled(motion(Link))`
    padding: 20px 24px;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e6e6e666;

    display: flex;
    justify-content: space-between;
    align-items: center;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #3182f6 0%, #00d2ff 100%);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    &:active {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }
`;

const MeetingInfo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    flex: 1;
`;

const MeetingHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const MeetingDate = styled.span`
    font-size: 13px;
    color: #8b95a1;
    font-weight: 500;
    letter-spacing: -0.2px;
`;

const MeetingTag = styled.span.withConfig({
    shouldForwardProp: (prop) => {
        return prop !== 'bgColor' && prop !== 'textColor';
    },
})`
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 8px;
    letter-spacing: -0.1px;
    background: ${(props) => props.bgColor};
    color: ${(props) => props.textColor};
`;

const MeetingName = styled.span`
    font-size: 14px;
    font-weight: 600;
    color: #191f28;
    letter-spacing: -0.3px;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 8px;
    @media (max-width: 350px) {
        flex-direction: column;
        gap: 6px;
    }
`;

const spinAnimation = keyframes`
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
`;

const SmallSpinner = styled.div`
    width: 18px;
    height: 18px;
    border: 2px solid #f3f4f6;
    border-top: 2px solid #6c757d;
    border-radius: 50%;
    animation: ${spinAnimation} 0.8s linear infinite;
`;

const IconButton = styled(motion.button)`
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: #6c757d;

    &:hover {
        background: #e9ecef;
        transform: translateY(-1px);
        color: #495057;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    }

    &:first-child:hover {
        background: #e3f2fd;
        color: #1976d2;
    }

    &:last-child:hover {
        background: #ffebee;
        color: #d32f2f;
    }
`;

const StyledButton = styled(motion.button).withConfig({
    shouldForwardProp: (prop) => prop !== '$variant' && prop !== '$isLoading',
})`
    flex: 1;
    padding: 17px 22px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    letter-spacing: -0.3px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0) 100%
        );
        opacity: 0;
        transition: opacity 0.25s ease;
    }

    &:hover::before {
        opacity: 1;
    }

    ${({ $variant }) => {
        switch ($variant) {
            case 'primary':
                return `
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          color: white;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(59, 130, 246, 0.35);
          }
        `;
            case 'secondary':
                return `
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: white;
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(245, 158, 11, 0.35);
          }
        `;
            case 'tertiary':
                return `
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
          color: white;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(139, 92, 246, 0.35);
          }
        `;
        }
    }}

    &:active {
        transform: translateY(0px);
    }

    ${({ $isLoading }) =>
        $isLoading &&
        `
        cursor: not-allowed;
        opacity: 0.7;
        pointer-events: none;
    `}
`;

const EmptyState = styled(motion.div)`
    margin: 15% 0;
    text-align: center;
    padding: 48px 24px;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);

    p {
        color: #6c757d;
        font-size: 16px;
        font-weight: 500;
        margin: 8px 0;
        line-height: 1.5;
        letter-spacing: -0.2px;

        &:first-child {
            font-size: 18px;
            font-weight: 600;
            color: #495057;
        }
    }
`;

const AddButtonContainer = styled(motion.div)`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 20;
    padding: 10px;
    @media (max-width: 767px) {
        display: none;
    }
`;

export const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + '...' : str;
};

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
    border-radius: ${(props) => props.borderRadius || '8px'};
    width: ${(props) => props.width || '100%'};
    height: ${(props) => props.height || '16px'};
`;

const MeetingSkeletonCard = styled.div`
    padding: 20px 24px;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e6e6e666;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
`;

const Meeting = ({ user }) => {
    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [creatingType, setCreatingType] = useState(null);
    const navigate = useNavigate();
    const [openMenuModal, setOpenMenuModal] = useState(false);
    const [openUserSettingModal, setUserSettingModal] = useState(false);
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [deletingMeetingId, setDeletingMeetingId] = useState(null);

    const getUserDisplayName = () => {
        if (!user) return '게스트';
        if (user.name) {
            return user.name;
        }
        // 게스트 사용자이고 name이 null인 경우
        if (user.type === 'guest' && user.id) {
            return `게스트_${user.id}`;
        }
        return '게스트';
    };

    const tripMeetings = useMemo(
        () =>
            meetings.filter(
                (meeting) => meeting.is_trip === true || meeting.is_trip === 1,
            ),
        [meetings],
    );
    const regularMeetings = useMemo(
        () =>
            meetings.filter(
                (meeting) =>
                    meeting.is_simple !== true &&
                    meeting.is_simple !== 1 &&
                    meeting.is_trip !== true &&
                    meeting.is_trip !== 1,
            ),
        [meetings],
    );
    const simpleMeetings = useMemo(
        () =>
            meetings.filter(
                (meeting) =>
                    meeting.is_simple === true || meeting.is_simple === 1,
            ),
        [meetings],
    );

    const displayMeetings = useMemo(() => {
        if (activeFilter === 'trip') return tripMeetings;
        if (activeFilter === 'regular') return regularMeetings;
        if (activeFilter === 'simple') return simpleMeetings;
        return meetings;
    }, [activeFilter, meetings, tripMeetings, regularMeetings, simpleMeetings]);

    const handleGetData = async () => {
        setIsLoading(true);
        try {
            const responseGetData = await getMeetingData('meeting');
            setMeetings(responseGetData.data);
        } catch (error) {
            console.log('Api 데이터 불러오기 실패');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        handleGetData();
    }, []);

    useEffect(() => {
        if (!openMenuModal) {
            handleGetData();
        }
    }, [openMenuModal]);

    const handleAddBilling = async (meetingType) => {
        setCreatingType(meetingType);
        try {
            if (meetingType === 'simple') {
                const responseSimple = await PostSimpleSettlementData();
                if (responseSimple.status === 201) {
                    handleGetData();
                    const locationHeader =
                        responseSimple.headers.location ||
                        responseSimple.headers['location'] ||
                        responseSimple.headers.Location;
                    if (locationHeader) {
                        const meetingId = locationHeader.split('/').pop();
                        sendEventToAmplitude('create new meeting', '');
                        navigate(`/simple-settlement/${meetingId}`);
                    }
                }
            } else if (meetingType === 'billing') {
                const responseMeeting = await postMeetingrData('meeting');
                if (responseMeeting.status === 201) {
                    handleGetData();
                    const locationHeader =
                        responseMeeting.headers.location ||
                        responseMeeting.headers['location'] ||
                        responseMeeting.headers.Location;
                    if (locationHeader) {
                        sendEventToAmplitude('create new simpleSettlement', '');
                        navigate(`/${locationHeader}`);
                    }
                }
            }
        } catch (error) {
            console.log('Api 데이터 보내기 실패');
        } finally {
            setCreatingType(null);
        }
    };

    const handelDeleteBilling = async (meetingid) => {
        setDeletingMeetingId(meetingid);
        try {
            await deleteMeetingData(meetingid);
            setMeetings(meetings.filter((data) => data.id !== meetingid));
        } catch (error) {
            console.log('Api 데이터 삭제 실패');
        } finally {
            setDeletingMeetingId(null);
        }
    };

    const renderMeetingCard = (meeting) => {
        if (!meeting || !meeting.id) {
            return null;
        }

        const isTrip = meeting.is_trip === true || meeting.is_trip === 1;
        const isSimple = meeting.is_simple === true || meeting.is_simple === 1;

        let linkTo;
        let tagBg;
        let tagColor;
        let tagText;

        if (isTrip) {
            linkTo = `/trip/${meeting.id}/dashboard`;
            tagBg = '#f3e8ff';
            tagColor = '#8B5CF6';
            tagText = '여행정산';
        } else if (isSimple) {
            linkTo = `/simple-settlement/${meeting.id}`;
            tagBg = '#fef3c7';
            tagColor = '#d97706';
            tagText = '간편정산';
        } else {
            linkTo = `/meeting/${meeting.id}`;
            tagBg = '#dbeafe';
            tagColor = '#1d4ed8';
            tagText = '모임정산';
        }

        return (
            <MeetingCard
                to={linkTo}
                initial={{
                    opacity: 0,
                    scale: 0.8,
                }}
                animate={{
                    opacity: 1,
                    scale: 1,
                }}
                exit={{
                    opacity: 0,
                    scale: 0.8,
                }}
                transition={{ duration: 0.2 }}
            >
                <MeetingInfo>
                    <MeetingHeader>
                        <MeetingDate>{meeting.date}</MeetingDate>
                        <MeetingTag bgColor={tagBg} textColor={tagColor}>
                            {tagText}
                        </MeetingTag>
                    </MeetingHeader>
                    <MeetingName>{truncate(meeting.name, 15)}</MeetingName>
                </MeetingInfo>
                <ActionButtons>
                    <IconButton
                        whileTap={{
                            scale: 0.9,
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            setSelectedMeetingId(meeting.id);
                            setOpenMenuModal(true);
                        }}
                    >
                        <AiOutlineEdit size={18} />
                    </IconButton>
                    <IconButton
                        whileTap={{
                            scale: 0.9,
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            handelDeleteBilling(meeting.id);
                        }}
                        disabled={deletingMeetingId === meeting.id}
                        style={{
                            opacity: deletingMeetingId === meeting.id ? 0.6 : 1,
                            cursor: deletingMeetingId === meeting.id ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {deletingMeetingId === meeting.id ? (
                            <SmallSpinner />
                        ) : (
                            <RiDeleteBinLine size={18} />
                        )}
                    </IconButton>
                </ActionButtons>
            </MeetingCard>
        );
    };

    return (
        <Container>
            <Header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <HeaderTop>
                    {isLoading || !user ? (
                        <SkeletonBox
                            width="180px"
                            height="24px"
                            borderRadius="4px"
                        />
                    ) : (
                        <UserName>{getUserDisplayName()}님의 모임 👋</UserName>
                    )}
                    <SettingButton
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setUserSettingModal(true)}
                    >
                        <img
                            src="/images/Setting.png"
                            alt="설정"
                            width="24"
                            onClick={() => setUserSettingModal(true)}
                        />
                    </SettingButton>
                    {openUserSettingModal && (
                        <UserSettingModal
                            setUserSettingModal={setUserSettingModal}
                            user={user}
                        />
                    )}
                </HeaderTop>

                <FilterTabs>
                    <FilterTab
                        active={activeFilter === 'all'}
                        onClick={() => setActiveFilter('all')}
                        whileTap={{ scale: 0.98 }}
                    >
                        전체
                        <FilterCount active={activeFilter === 'all'}>
                            {meetings.length}
                        </FilterCount>
                    </FilterTab>
                    <FilterTab
                        active={activeFilter === 'trip'}
                        onClick={() => setActiveFilter('trip')}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            background:
                                activeFilter === 'trip' ? '#8B5CF6' : '#f1f3f5',
                            color:
                                activeFilter === 'trip' ? '#ffffff' : '#6b7684',
                        }}
                    >
                        여행정산
                        <FilterCount
                            active={activeFilter === 'trip'}
                            style={{
                                background:
                                    activeFilter === 'trip'
                                        ? 'rgba(255,255,255,0.2)'
                                        : '#dee2e6',
                                color:
                                    activeFilter === 'trip'
                                        ? '#ffffff'
                                        : '#495057',
                            }}
                        >
                            {tripMeetings.length}
                        </FilterCount>
                    </FilterTab>
                    <FilterTab
                        active={activeFilter === 'regular'}
                        onClick={() => setActiveFilter('regular')}
                        whileTap={{ scale: 0.98 }}
                    >
                        모임정산
                        <FilterCount active={activeFilter === 'regular'}>
                            {regularMeetings.length}
                        </FilterCount>
                    </FilterTab>
                    <FilterTab
                        active={activeFilter === 'simple'}
                        onClick={() => setActiveFilter('simple')}
                        whileTap={{ scale: 0.98 }}
                    >
                        간편정산
                        <FilterCount active={activeFilter === 'simple'}>
                            {simpleMeetings.length}
                        </FilterCount>
                    </FilterTab>
                </FilterTabs>
            </Header>
            <MeetingList
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            {[1, 2, 3, 4].map((index) => (
                                <MeetingSkeletonCard key={index}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            flex: 1,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            <SkeletonBox
                                                width="80px"
                                                height="13px"
                                                borderRadius="4px"
                                            />
                                            <SkeletonBox
                                                width="60px"
                                                height="20px"
                                                borderRadius="8px"
                                            />
                                        </div>
                                        <SkeletonBox
                                            width="150px"
                                            height="14px"
                                            borderRadius="4px"
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '8px',
                                        }}
                                    >
                                        <SkeletonBox
                                            width="44px"
                                            height="44px"
                                            borderRadius="12px"
                                        />
                                        <SkeletonBox
                                            width="44px"
                                            height="44px"
                                            borderRadius="12px"
                                        />
                                    </div>
                                </MeetingSkeletonCard>
                            ))}
                        </motion.div>
                    ) : meetings.length > 0 ? (
                        <motion.div
                            key={activeFilter}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            {displayMeetings.length > 0 ? (
                                displayMeetings
                                    .filter((meeting) => meeting && meeting.id)
                                    .map((meeting) => {
                                        const card = renderMeetingCard(meeting);
                                        if (!card) return null;
                                        return (
                                            <React.Fragment key={meeting.id}>
                                                {card}
                                            </React.Fragment>
                                        );
                                    })
                            ) : (
                                <EmptyState
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <p>
                                        {activeFilter === 'regular'
                                            ? '아직 모임정산이 없어요'
                                            : '아직 간편정산이 없어요'}
                                    </p>
                                    <p>새로운 정산을 시작해보세요 ✨</p>
                                </EmptyState>
                            )}
                        </motion.div>
                    ) : (
                        <EmptyState
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <p>아직 등록된 모임이 없어요</p>
                            <p>새로운 모임을 시작해보세요 ✨</p>
                        </EmptyState>
                    )}
                </AnimatePresence>
            </MeetingList>

            {openMenuModal && selectedMeetingId !== null && (
                <BillingNameModal
                    setOpenMenuModal={setOpenMenuModal}
                    MainMeetingId={selectedMeetingId}
                    MainMeetingName={
                        meetings.find((m) => m.id === selectedMeetingId)?.name
                    }
                />
            )}

            {/* Mobile FAB (<768px) */}
            <div
                className="fixed bottom-6 right-6 z-50 md:hidden"
                style={{ position: 'fixed' }}
            >
                <AnimatePresence>
                    {isFabOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex flex-col gap-3"
                            style={{
                                position: 'absolute',
                                bottom: 76,
                                right: 0,
                            }}
                        >
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                onClick={() => {
                                    handleAddBilling('simple');
                                    setIsFabOpen(false);
                                }}
                                disabled={creatingType !== null}
                                className="w-full flex items-center gap-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-5 py-3.5 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{
                                    boxShadow:
                                        '0 4px 16px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    {creatingType === 'simple' ? (
                                        <LoadingSpinner
                                            type="circular"
                                            size="small"
                                            color="#ffffff"
                                        />
                                    ) : (
                                        <Zap className="w-5 h-5" />
                                    )}
                                </div>
                                <span className="text-[15px] font-semibold whitespace-nowrap">
                                    {creatingType === 'simple'
                                        ? '생성중...'
                                        : '간편 정산 만들기'}
                                </span>
                            </motion.button>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                onClick={() => {
                                    handleAddBilling('billing');
                                    setIsFabOpen(false);
                                }}
                                disabled={creatingType !== null}
                                className="w-auto flex items-center gap-3 bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white px-5 py-3.5 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{
                                    boxShadow:
                                        '0 4px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    {creatingType === 'billing' ? (
                                        <LoadingSpinner
                                            type="circular"
                                            size="small"
                                            color="#ffffff"
                                        />
                                    ) : (
                                        <Users className="w-5 h-5" />
                                    )}
                                </div>
                                <span className="text-[15px] font-semibold whitespace-nowrap">
                                    {creatingType === 'billing'
                                        ? '모임 생성중...'
                                        : '새로운 모임 만들기'}
                                </span>
                            </motion.button>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                onClick={() => {
                                    navigate('/trip');
                                    setIsFabOpen(false);
                                }}
                                className="w-auto flex items-center gap-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white px-5 py-3.5 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
                                style={{
                                    boxShadow:
                                        '0 4px 16px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Plane className="w-5 h-5" />
                                </div>
                                <span className="text-[15px] font-semibold whitespace-nowrap">
                                    여행 정산 만들기
                                </span>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFabOpen((prev) => !prev)}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
                    style={{
                        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                    }}
                >
                    <motion.div
                        animate={{ rotate: isFabOpen ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Plus className="w-7 h-7" strokeWidth={2.5} />
                    </motion.div>
                </motion.button>
            </div>

            <AddButtonContainer
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <StyledButton
                    $variant="primary"
                    $isLoading={creatingType === 'billing'}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddBilling('billing')}
                    disabled={creatingType !== null}
                >
                    {creatingType === 'billing' ? (
                        <>
                            <LoadingSpinner type="circular" size="small" />
                            모임 생성중...
                        </>
                    ) : (
                        <>
                            <Users size={20} strokeWidth={2.5} />
                            새로운 모임 만들기
                        </>
                    )}
                </StyledButton>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <StyledButton
                        $variant="secondary"
                        $isLoading={creatingType === 'simple'}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAddBilling('simple')}
                        disabled={creatingType !== null}
                    >
                        {creatingType === 'simple' ? (
                            <>
                                <LoadingSpinner type="circular" size="small" />
                                생성중...
                            </>
                        ) : (
                            <>
                                <Zap size={20} strokeWidth={2.5} />
                                간편 정산
                            </>
                        )}
                    </StyledButton>
                    <StyledButton
                        $variant="tertiary"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/trip')}
                    >
                                <Plane size={20} strokeWidth={2.5} />
                                여행 정산
                    </StyledButton>
                </div>
            </AddButtonContainer>
        </Container>
    );
};

export default Meeting;
