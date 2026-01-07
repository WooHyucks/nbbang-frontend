import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
    getMeetingData,
    postMeetingrData,
    deleteMeetingData,
    GetMeetingNameData,
} from '../api/api';
import Cookies from 'js-cookie';
import Nav from './Nav';
import BillingNameModal from './modal/BillingNameModal';

const MainContainer = styled.div`
    position: relative;
    max-width: 670px;
`;

const MeetingContainer = styled.div`
    margin-top: 25px;
    display: flex;
    flex-direction: column;

    @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
    }
`;

const LogOut = styled.div`
    height: 100%;
    width: 10px;
    border-left: 1px solid #e6e6e666;
    cursor: pointer;
    img {
        margin: 5px 0px 0px 7px;
        width: 20px;
    }
`;

const MeetingAddButton = styled.button`
    cursor: pointer;
    height: 45px;
    border: none;
    width: 100%;
    font-weight: 600;
    margin-top: 300px;
    color: white;
    background-color: #0066ff;

    @media (max-width: 768px) {
        margin: 0;
    }
`;

const Billing = styled(Link)`
    width: 350px;
    display: flex;
    margin-left: 20px;
    gap: 50px;
    align-items: center;
    @media (max-width: 380px) {
        gap: 25px;
    }
`;

const BillingDate = styled.p`
    font-size: 14px;
`;

const BillingName = styled.p`
    font-size: 14px;
`;

const BillingDeleteButton = styled.div`
    cursor: pointer;
    img {
        width: 23px;
    }
    animation: fadeOut 700ms;
    @keyframes fadeOut {
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

const NavContainer = styled.div`
    background-color: white;
    position: sticky;
    top: 0;
    z-index: 1;
    height: 60px;
    border-bottom: 1px solid #e1e1e1a8;
    box-shadow: 0px 2px 4px 0px #d9d9d980;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const UserId = styled.p`
    font-size: 14px;
`;

const UserSeting = styled.div`
    box-shadow: 0px 2px 3px #c3a99759;
    border-radius: 12px;
    border: 1px solid #e6e6e666;
    margin-bottom: 10px;
    width: 105px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
`;

const StyledLink = styled(Link)`
    position: fixed;
    bottom: 0;
    font-size: 13px;
    left: 50;
    width: 670px;
    transform: translateX(-50%);
    @media (max-width: 768px) {
        position: fixed;
        bottom: 0;
        font-size: 13px;
        left: 0;
        width: 100%;
        transform: none;
    }
`;

const MenuOpenModal = styled.div`
    img {
        width: 23px;
    }
    animation: fadeIn 500ms;
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

const MenuIcon = styled.img`
    margin-right: 20px;
    width: 20px;
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

const MenuContainer = styled.div`
    display: flex;
    gap: 23px;
    margin-right: 20px;
`;

const BillingLink = styled.div`
    margin-top: 13px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    box-shadow: 0px 2px 3px #c3a99759;
    border: 1px solid #e6e6e666;
    height: 65px;
    border-radius: 15px;
    animation: fadeOut 500ms;
    @keyframes fadeOut {
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

export const truncate = (str, n) => {
    return str?.length > n ? str.substring(0, n) + '...' : str;
};

const Meeting = ({ user }) => {
    const [meetings, setMeetings] = useState([]);
    const navigate = useNavigate();
    const [openModal, setOpenModal] = useState(false);

    const handleGetData = async () => {
        try {
            const responseGetData = await getMeetingData('meeting');
            setMeetings(responseGetData.data);
        } catch (error) {
            console.log('Api 데이터 불러오기 실패');
        }
    };

    useEffect(() => {
        handleGetData();
    }, []);

    useEffect(() => {
        if (!openModal) {
            handleGetData();
        }
    }, [openModal]);

    const handleAddBilling = async () => {
        try {
            const response = await postMeetingrData('meeting');
            if (response.status === 201) {
                handleGetData();
                const responseHeaders = response.headers.get('Location');
                navigate(`/${responseHeaders}`);
            }
        } catch (error) {
            console.log('Api 데이터 보내기 실패');
        }
    };

    const handelDeleteBilling = async (meetingid) => {
        try {
            await deleteMeetingData(meetingid);
            setMeetings(meetings.filter((data) => data.id !== meetingid));
        } catch (error) {
            console.log('Api 데이터 삭제 실패');
        }
    };

    const handleLogOut = () => {
        Cookies.remove('authToken');
        navigate('/signd');
    };

    const handleToggleMenu = (meetingId) => {
        setMeetings((prevMeetings) =>
            prevMeetings.map((meeting) =>
                meeting.id === meetingId
                    ? { ...meeting, menu: !meeting.menu }
                    : meeting,
            ),
        );
    };

    const handleClick = (e) => {
        e.preventDefault();
        setOpenModal(true);
    };

    return (
        <MainContainer>
            <NavContainer>
                <Nav />
                <UserSeting>
                    <UserId>{user.name}</UserId>
                    <LogOut onClick={handleLogOut}>
                        <img
                            alt="logOut"
                            src="/images/Logout.png"
                            onClick={() => (window.location.href = '/')}
                        />
                    </LogOut>
                </UserSeting>
            </NavContainer>
            <MeetingContainer>
                {meetings.map((data) => (
                    <BillingLink>
                        <Billing
                            key={data.id}
                            to={`meeting/${data.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <BillingDate>{data.date}</BillingDate>
                            <BillingName>{truncate(data.name, 13)}</BillingName>
                        </Billing>
                        {data.menu ? (
                            <MenuContainer>
                                <MenuOpenModal onClick={handleClick}>
                                    <img alt="fix" src="/images/fix.png" />
                                </MenuOpenModal>
                                {openModal && (
                                    <BillingNameModal
                                        setOpenModal={setOpenModal}
                                        MainMeetingId={data.id}
                                        MainMeetingName={data.name}
                                    />
                                )}
                                <BillingDeleteButton
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handelDeleteBilling(data.id);
                                    }}
                                >
                                    <img
                                        alt="Delete"
                                        src="/images/Delete.png"
                                    />
                                </BillingDeleteButton>
                            </MenuContainer>
                        ) : (
                            <MenuIcon
                                alt="Menu"
                                src="/images/Menu.png"
                                onClick={(e) => {
                                    handleToggleMenu(data.id);
                                    e.preventDefault();
                                }}
                            />
                        )}
                    </BillingLink>
                ))}
            </MeetingContainer>
            <StyledLink>
                <MeetingAddButton onClick={handleAddBilling}>
                    모임 추가하기
                </MeetingAddButton>
            </StyledLink>
        </MainContainer>
    );
};

export default Meeting;
