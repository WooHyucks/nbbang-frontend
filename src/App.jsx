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
// import AppBar from './components/common/AppBar';
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
import AiResultLoading from './components/common/AiResultLoading';
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
                            // 응답 형식에 따라 토큰 추출 (단순 문자열 또는 객체)
                            const token = response.data.access_token || response.data;
                            
                            if (token && typeof token === 'string') {
                                Cookies.set('authToken', token, {
                                    expires: 36500, // 약 100년
                                    path: '/',
                                    sameSite: 'Strict',
                                    secure: window.location.protocol === 'https:',
                                });
                                console.log('[App] 게스트 로그인 성공 & 토큰 저장 완료');
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

    if (isInitializing) {
        return <AiResultLoading />;
    }

    return (
        <div className="App">
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
                            <Route path="/share" element={<ShareRouter />} />
                            <Route path="/share/ai" element={<SharePage />} />
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

        </div>
    );
}

function ShareRouter() {
    const [searchParams] = useSearchParams();

    // 1. 훅을 통한 1차 파싱
    let meeting = searchParams.get('meeting');
    let simpleMeeting = searchParams.get('simple-meeting');
    let ai = searchParams.get('ai');

    // 2. 훅 실패 시 window 객체 직접 접근 (갤럭시 웹뷰 호환성 보완)
    if (!meeting && !simpleMeeting && !ai) {
        try {
            const rawParams = new URLSearchParams(window.location.search);
            meeting = rawParams.get('meeting');
            simpleMeeting = rawParams.get('simple-meeting');
            ai = rawParams.get('ai');
        } catch (e) {
            console.error('Manual URL parsing failed:', e);
        }
    }

    // 3. 라우팅 로직 (우선순위: ai > meeting > simple-meeting)
    if (ai) {
        return <SharePage />;
    } else if (meeting) {
        return <ResultPage meetingId={meeting} />;
    } else if (simpleMeeting) {
        return <SimpleSettlementResultPage simpleMeetingId={simpleMeeting} />;
    } else {
        // 4. 디버깅용 UI (배포 후 원인 파악용)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full">
                    <h2 className="text-lg font-bold text-red-500 mb-2">
                        잘못된 접근입니다
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        공유 링크 정보를 불러올 수 없습니다.
                    </p>

                    <div className="bg-gray-100 p-3 rounded text-xs text-left break-all text-gray-500 mb-4 font-mono">
                        <p>
                            <strong>Debug Info:</strong>
                        </p>
                        <p className="mt-1">URL: {window.location.href}</p>
                        <p className="mt-1">
                            Query: {window.location.search || '(없음)'}
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-md transition-colors"
                    >
                        새로고침
                    </button>
                </div>
            </div>
        );
    }
}

export default App;
