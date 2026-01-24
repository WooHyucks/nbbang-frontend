import * as amplitude from '@amplitude/analytics-browser';
import { getUserData, Token } from '../api/api';

const amplitudeApiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
const devAmplitudeApiKey = import.meta.env.VITE_DEV_AMPLITUDE_API_KEY;

const ampKey = import.meta.env.DEV
    ? devAmplitudeApiKey || amplitudeApiKey
    : amplitudeApiKey;

// 프로덕션 환경에서 API 키 확인 로그
if (!import.meta.env.DEV) {
    if (!ampKey) {
        console.error(
            '[Amplitude] Production API key is missing. VITE_AMPLITUDE_API_KEY is not set.',
        );
    } else {
        console.log('[Amplitude] API key is configured for production');
    }
}

let isInitialized = false;
let initializationPromise = null;

export const initializeAmplitude = async () => {
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        if (!ampKey) {
            console.error(
                '[Amplitude] API key is missing. Please set VITE_AMPLITUDE_API_KEY in your environment variables.',
            );
            return;
        }

        try {
            await amplitude.init(ampKey, {
                defaultTracking: {
                    attribution: true,
                    pageViews: false,
                    sessions: true,
                    formInteractions: false,
                    fileDownloads: false,
                },
            });
            isInitialized = true;
            if (import.meta.env.DEV) {
                console.log('[Amplitude] Initialized successfully');
            }
        } catch (error) {
            console.error('[Amplitude] Initialization failed:', error);
            isInitialized = false;
        }
    })();

    return initializationPromise;
};

export const AmplitudeSetUserId = async () => {
    const authToken = Token();
    try {
        if (authToken) {
            const userInfo = await getUserData('user');
            return amplitude.setUserId(
                userInfo.data.identifier
                    ? userInfo.data.identifier
                    : `${userInfo.data.platform}_${userInfo.data.id}`,
            );
        }
    } catch (error) {
        console.error('Amplitude 초기화 중 오류 발생:', error);
    }
};

export const AmplitudeResetUserId = async () => {
    try {
        amplitude.reset();
    } catch (error) {
        console.error('Amplitude 초기화 중 오류 발생:', error);
    }
};

const getUserInfoForEvent = async () => {
    const authToken = Token();
    if (!authToken) {
        return null;
    }

    try {
        const userInfo = await getUserData('user');
        const user = userInfo.data;

        // 로그인한 사용자: 이름이 있으면 이름, 없으면 identifier
        if (user.name) {
            return user.name;
        }

        // 게스트 사용자
        if (user.type === 'guest' && user.id) {
            return `guest_${user.id}`;
        }

        // 기타: identifier 또는 platform_id 형식
        if (user.identifier) {
            return user.identifier;
        }

        if (user.platform && user.id) {
            return `${user.platform}_${user.id}`;
        }

        return null;
    } catch (error) {
        // 사용자 정보 가져오기 실패 시 null 반환 (에러 무시)
        return null;
    }
};

export const sendEventToAmplitude = async (eventName, properties) => {
    // API 키가 없으면 이벤트 전송하지 않음
    if (!ampKey) {
        console.error(
            `[Amplitude] API key missing. Event "${eventName}" will not be tracked.`,
        );
        return;
    }

    // 초기화가 시작되지 않았으면 시작
    if (!initializationPromise) {
        initializationPromise = initializeAmplitude();
    }

    // 초기화가 완료될 때까지 대기
    if (!isInitialized) {
        try {
            await initializationPromise;
        } catch (error) {
            // 초기화 실패 시 이벤트 전송하지 않음
            console.error(
                `[Amplitude] Initialization failed. Event "${eventName}" will not be tracked.`,
                error,
            );
            return;
        }
    }

    // 초기화가 안 되었으면 이벤트 전송하지 않음
    if (!isInitialized) {
        console.error(
            `[Amplitude] Not initialized. Event "${eventName}" will not be tracked.`,
        );
        return;
    }

    try {
        // 사용자 정보 가져오기
        const userId = await getUserInfoForEvent();

        // 이벤트 속성에 user_id 추가
        const eventProperties = {
            ...(properties || {}),
            ...(userId && { user_id: userId }),
        };

        amplitude.track(eventName, eventProperties);
    } catch (error) {
        console.error('[Amplitude] Event tracking failed:', error);
    }
};
