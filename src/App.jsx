import {
    BrowserRouter as Router,
    Route,
    Routes,
    useSearchParams,
} from 'react-router-dom';
import './App.css';
import SigndPage from './pages/SigndPage';
import MainPage from './pages/MainPage';
import BillingPage from './pages/BillingPage';
import ResultPage from './pages/ResultPage';
import UserProtocolPage from './pages/UserProtocolPage';
import SignIn from './components/Auth/SignIn';
import SimpleSettlementPage from './pages/simpleSettlementPage';
import SignUp from './components/Auth/SignUp';
import AppBar from './components/common/AppBar';
import ServerErrorPage from './pages/ServerErrorPage';
import {
    KakaoRedirect,
    GooglesRedirect,
    NaverRedirect,
} from './components/SocialLogin/SocialPlatformRedirect';
import SimpleSettlementResultPage from './pages/simpleSettlementResultPage';
import TripPage from './pages/TripPage';
import TripDashboard from './pages/TripDashboard';
import TripDashboardPage from './pages/TripDashboard/TripDashboardPage';
import SharedTripPage from './pages/SharedTripPage';
import SharePage from './pages/SharePage';
import AiMeetingDetail from './pages/AiMeetingDetail';
import QRCodeModal from './components/Modal/QRCodeModal';
import { AmplitudeSetUserId, initializeAmplitude } from './utils/amplitude';
import { useEffect, useState } from 'react';
import LoadingSpinner from './components/common/LodingSpinner';
import { motion } from 'framer-motion';
import { postGuestLogin } from './api/api';
import Cookies from 'js-cookie';

function App() {
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // 1. Amplitude 초기화
                await initializeAmplitude();

                // 2. 토큰 확인 및 게스트 로그인 처리
                const existingToken = Cookies.get('authToken');
                
                if (!existingToken) {
                    // Case A: 토큰 없음 → 게스트 로그인 자동 실행
                    try {
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
                            }
                        }
                    } catch (error) {
                        console.error('게스트 로그인 실패:', error);
                        // 게스트 로그인 실패해도 앱은 계속 작동하도록 함
                    }
                }
                // Case B: 토큰 있음 → 기존 토큰 유지

                // 3. Amplitude User ID 설정
                await AmplitudeSetUserId();
            } catch (error) {
                console.error('Error in initialization:', error);
            } finally {
                // 모든 초기화 작업 완료
                setIsInitializing(false);
            }
        };

        initializeApp();
    }, []);

    return (
        <div className={isInitializing ? 'flex justify-center' : 'App'}>
            {isInitializing ? (
                <LoadingSpinner />
            ) : (
                <div className="bg-white w-full">
                        <Router>
                            <Routes>
                                <Route path="/signd" element={<SigndPage />} />
                                <Route
                                    path="/kakao-redirect"
                                    element={<KakaoRedirect />}
                                />
                                <Route
                                    path="/naver-redirect"
                                    element={<NaverRedirect />}
                                />
                                <Route
                                    path="/google-redirect"
                                    element={<GooglesRedirect />}
                                />
                                <Route index element={<MainPage />} />
                                <Route
                                    path="/meeting/ai/:id"
                                    element={<MainPage />}
                                />
                                <Route
                                    path="/meeting/:meetingId"
                                    element={<BillingPage />}
                                />
                                <Route
                                    path="/share"
                                    element={<ShareRouter />}
                                />
                                <Route
                                    path="/share/ai"
                                    element={<SharePage />}
                                />
                                <Route path="/sign-up" element={<SignUp />} />
                                <Route path="/sign-in" element={<SignIn />} />
                                <Route
                                    path="/user-protocol"
                                    element={<UserProtocolPage />}
                                />
                                <Route
                                    path="/simple-settlement/:meetingId"
                                    element={<SimpleSettlementPage />}
                                />
                                <Route
                                    path="/server-error"
                                    element={<ServerErrorPage />}
                                />
                                <Route path="/trip" element={<TripPage />} />
                                <Route
                                    path="/trip/:meetingId/dashboard"
                                    element={<TripDashboard />}
                                />
                                {/* 공유 페이지 (UUID 기반) */}
                                <Route
                                    path="/meeting/share/trip"
                                    element={<SharedTripPage />}
                                />
                                {/* 여행 정산 결과 페이지 */}
                                <Route
                                    path="/meeting/trip-page"
                                    element={<TripDashboardPage />}
                                />
                            </Routes>
                        </Router>
                    </div>
            )}
        </div>
    );
}

function ShareRouter() {
    const [searchParams] = useSearchParams();
    const meeting = searchParams.get('meeting');
    const simpleMeeting = searchParams.get('simple-meeting');
    const ai = searchParams.get('ai');

    // AI 정산 공유 링크 우선 처리
    if (ai) {
        return <SharePage />;
    } else if (meeting) {
        return <ResultPage meetingId={meeting} />;
    } else if (simpleMeeting) {
        return <SimpleSettlementResultPage simpleMeetingId={simpleMeeting} />;
    } else {
        return <div>Invalid parameters</div>;
    }
}

export default App;
