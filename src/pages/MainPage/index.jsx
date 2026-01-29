import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu, Sparkles, LogIn, LogOut } from 'lucide-react';
import ChatContainer from '../../components/AiChat/ChatContainer';
import ChatSidebar from '../../components/AiChat/ChatSidebar';
import { getUserData, Token, postGuestLogin } from '../../api/api';
import Cookies from 'js-cookie';
import { sendEventToAmplitude, AmplitudeSetUserId } from '@/utils/amplitude';

const MainPage = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // URL에서 ID 추출
    const authToken = Token();
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

    // 게스트 자동 로그인은 App.jsx에서 처리하므로 이 체크 제거

    useEffect(() => {
        fetchData();
        sendEventToAmplitude('view meeting page', '');
    }, []);

    const fetchData = async () => {
        try {
            const response = await getUserData('user');

            // 백엔드 응답 구조에 따라 데이터 추출
            // 가능한 구조들:
            // 1. response.data가 직접 user 객체인 경우
            // 2. response.data.data가 user 객체인 경우
            // 3. response.data.user가 user 객체인 경우
            let userData = response.data;

            // 중첩된 구조 처리
            if (userData?.data) {
                userData = userData.data;
            } else if (userData?.user) {
                userData = userData.user;
            }

            // 디버깅: 전체 응답 구조 확인

            setUser(userData);
        } catch (error) {
            // 401 (Unauthorized)일 때만 토큰 제거
            if (error.response && error.response.status === 401) {
                Cookies.remove('authToken', { path: '/' });
                navigate('/');
            }
        }
    };

    const handleLogout = async () => {
        try {
            // 회원 토큰 제거
            Cookies.remove('authToken', { path: '/' });

            // 게스트 토큰 발급
            const response = await postGuestLogin();
            if (response.status === 201) {
                const token = response.data;
                if (token) {
                    Cookies.set('authToken', token, {
                        expires: 36500, // 약 100년
                        path: '/',
                        sameSite: 'Strict',
                        secure: window.location.protocol === 'https:',
                    });

                    // Amplitude User ID 재설정
                    await AmplitudeSetUserId();

                    // 사용자 데이터 다시 가져오기 (게스트 정보)
                    await fetchData();
                }
            }

            sendEventToAmplitude('click logout', '');
        } catch (error) {
            console.error('게스트 로그인 실패:', error);
            // 게스트 로그인 실패 시에도 메인 페이지 유지
        }
    };

    return (
        <div className="flex h-[100dvh] bg-[#F2F4F6] overflow-hidden">
            {/* 사이드바 (데스크탑: flex 레이아웃, 모바일: 오버레이) */}
            <ChatSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onNewChat={() => {
                    navigate('/');
                }}
                onSelectAiChat={(meetingId) => {
                    navigate(`/meeting/ai/${meetingId}`);
                    setIsSidebarOpen(false);
                }}
                activeMeetingId={id ? parseInt(id) : null}
                refreshTrigger={sidebarRefreshTrigger}
            />

            {/* 메인 컨텐츠 영역 */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* 헤더 - 모바일에서는 fixed로 상단 고정 */}
                <header className="md:sticky fixed md:relative top-0 left-0 right-0 z-30 md:z-20 bg-white border-b border-[#E5E8EB]">
                    <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-3">
                        {/* 햄버거 메뉴 (모바일만) */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 hover:bg-[#F2F4F6] rounded-xl transition-colors active:scale-95"
                            aria-label="메뉴 열기"
                        >
                            <Menu size={24} className="text-[#333D4B]" />
                        </button>

                        {/* 타이틀 (모바일) */}
                        <div className="flex items-center gap-2 md:hidden">
                            <Sparkles
                                size={20}
                                className="text-[#3182F6] animate-pulse"
                            />
                            <div className="text-xl font-bold tracking-tighter text-[#191F28]">
                                NBBANG<span className="text-[#3182F6]">.</span>
                            </div>{' '}
                        </div>

                        {/* 데스크탑 헤더 (채팅 제목 영역) */}
                        <div className="hidden md:flex items-center gap-3 flex-1">
                            <div className="text-xl font-bold tracking-tighter text-[#191F28]">
                                NBBANG<span className="text-[#3182F6]">.</span>
                            </div>
                        </div>

                        {/* 우측 액션 버튼들 */}
                        <div className="flex items-center gap-2">
                            {/* 게스트 사용자: 로그인 유도 버튼 */}
                            {user?.type === 'guest' && (
                                <button
                                    onClick={() => {
                                        sendEventToAmplitude(
                                            'click login from guest header',
                                            '',
                                        );
                                        navigate('/');
                                    }}
                                    className="flex items-center sm:w-[230px] w-full sm:inline gap-2 px-4 py-2  hover:bg-[#1E6FFF] text-white rounded-lg transition-colors text-sm font-medium"
                                    aria-label="로그인하고 저장하기"
                                >
                                    <span className="hidden sm:inline">

                                    </span>
                                    <span className="sm:hidden"></span>
                                </button>
                            )}

                            {/* 일반 사용자: 로그아웃 버튼 */}
                            {user?.type !== 'guest' && (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 text-[#8B95A1] hover:text-[#333D4B] hover:bg-[#F2F4F6] rounded-lg transition-colors text-sm font-medium"
                                    aria-label="로그아웃"
                                >

                                    <span className="hidden sm:inline w-[200px]">

                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* 채팅 컨테이너 */}
                <div className="flex-1 overflow-hidden bg-white">
                    <ChatContainer
                        key={id || 'new'} // ID가 바뀌면 컴포넌트 리셋
                        userName={user?.name}
                        meetingId={id ? parseInt(id) : undefined}
                        user={user}
                        onUserUpdate={fetchData}
                        onSettlementCreated={(newId) => {
                            // 사이드바 목록 갱신
                            setSidebarRefreshTrigger((prev) => prev + 1);
                            // URL 이동 -> ChatContainer가 자동으로 수정 모드로 전환
                            navigate(`/meeting/ai/${newId}`);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default MainPage;
