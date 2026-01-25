import { useEffect, useState } from 'react';

const AppBar = () => {
    const [hideAppBar, setHideAppBar] = useState(false);
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        // 앱바가 이미 닫혔는지 확인
        const isDismissed =
            localStorage.getItem('app_bar_dismissed') === 'true';
        if (isDismissed) {
            setHideAppBar(true);
            setShouldShow(false);
            return;
        }

        const userAgent = navigator.userAgent.toLowerCase();

        // 안드로이드 체크
        const isAndroid = userAgent.includes('android');

        // iOS 체크 (아이폰/아이패드)
        const isIOS = /iphone|ipad|ipod/.test(userAgent);

        // 앱 설치 여부 체크
        const isAppInstalled = localStorage.getItem('app_installed') === 'true';

        // 앱이 설치되었으면 무조건 숨김
        if (isAppInstalled) {
            setHideAppBar(true);
            setShouldShow(false);
            return;
        }

        // 안드로이드이고, iOS가 아니고, 앱이 설치되지 않았을 때만 표시
        if (isAndroid && !isIOS) {
            setShouldShow(true);
        } else {
            setHideAppBar(true);
            setShouldShow(false);
        }
    }, []);

    const handleAppOpen = () => {
        // Google Play Store 앱 페이지로 이동
        const playStoreUrl =
            import.meta.env.VITE_GOOGLE_PLAY_STORE_URL ||
            'https://play.google.com/store/apps/details?id=nbbang.middle&hl=ko';
        window.location.href = playStoreUrl;
    };

    const handleClose = () => {
        localStorage.setItem('app_bar_dismissed', 'true');
        setHideAppBar(true);
    };

    if (hideAppBar || !shouldShow) return null;

    return (
        <div className="sticky top-0 z-40 shadow-md">
            <div className="bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-start flex-col leading-tight min-w-0">
                        <span className="text-sm font-semibold md:text-base truncate">
                            앱에서 더 빠르게 정산하기
                        </span>
                        <span className="text-[12px] text-blue-50 md:text-sm truncate">
                            AI 정산, 원클릭 송금까지 한 번에
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={handleAppOpen}
                        className="bg-white text-[#1D4ED8] rounded-full font-semibold px-3 py-2 text-[13px] md:text-xs shadow-sm hover:shadow transition whitespace-nowrap"
                    >
                        앱에서 열기
                    </button>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-blue-100 transition p-1 flex-shrink-0"
                        aria-label="닫기"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppBar;
