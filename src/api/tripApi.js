import axios from 'axios';
import Cookies from 'js-cookie';

// 여행 정산 API Base URL
// 임시로 Supabase Functions 도메인 사용 (공유 페이지 및 결과 페이지용)
const TRIP_API_BASE_URL =
    'https://qdvwwnylfhhevwzdfumm.supabase.co/functions/v1';

// 토큰 가져오기
const getToken = () => {
    return Cookies.get('token') || Cookies.get('authToken');
};

// 여행 정산 전용 axios 인스턴스
const tripApiInstance = axios.create({
    baseURL: TRIP_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // 쿠키 포함
});

// 요청 인터셉터: 토큰 추가
tripApiInstance.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// 응답 인터셉터: 에러 처리
tripApiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Trip API Error:', error);
        return Promise.reject(error);
    },
);

// Meeting API
export const createTrip = async (countryCode, initialGonggeum) => {
    const response = await tripApiInstance.post('/meeting/trip', {
        country_code: countryCode,
        initial_gonggeum: initialGonggeum,
    });
    return response;
};

// 새로운 방식: contributions 기반 trip 생성
export const createTripWithContributions = async (data) => {
    const payload = {
        contributions: data.contributions, // [{ member_id, amount_krw, member_name }]
        total_foreign: data.total_foreign, // 외화 총액
        country_code: data.country_code, // 국가 코드
    };

    // advance_payments가 있으면 추가
    if (data.advance_payments && data.advance_payments.length > 0) {
        payload.advance_payments = data.advance_payments; // [{ name, price, pay_member_name }]
    }

    const response = await tripApiInstance.post('/meeting/trip', payload);
    return response;
};

// 실시간 대시보드 조회 (인증 불필요, UUID 기반)
// timestamp 파라미터 추가 (캐시 버스팅용, 기본값은 0)
export const getTripDashboardByUuid = async (uuid, timestamp = 0) => {
    // timestamp가 있으면 URL 뒤에 붙여서 캐시 무시
    const query = timestamp ? `&_t=${timestamp}` : '';
    // 인증 없이 호출하기 위해 별도 인스턴스 사용
    const response = await axios.get(
        `${TRIP_API_BASE_URL}/meeting/share/trip?uuid=${uuid}${query}`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: false,
        },
    );
    return response.data;
};

// 공유 페이지용 trip 조회 (로그인 없이)
// 임시로 Supabase Functions 도메인 직접 사용
export const getTripByUuid = async (uuid) => {
    const response = await axios.get(
        `${TRIP_API_BASE_URL}/meeting/trip-page?uuid=${uuid}`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: false,
        },
    );
    return response.data;
};

// 공유 페이지용 멤버 조회 (인증 없이)
// 임시로 Supabase Functions 도메인 직접 사용
export const getMembersByUuid = async (uuid) => {
    const response = await axios.get(
        `${TRIP_API_BASE_URL}/meeting/trip-page?uuid=${uuid}&type=members`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: false,
        },
    );
    return response.data;
};

// 공유 페이지용 지출 조회 (인증 없이)
// 임시로 Supabase Functions 도메인 직접 사용
export const getPaymentsByUuid = async (uuid) => {
    const response = await axios.get(
        `${TRIP_API_BASE_URL}/meeting/trip-page?uuid=${uuid}&type=payments`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: false,
        },
    );
    return response.data;
};

export const getTripDetail = async (meetingId) => {
    const response = await tripApiInstance.get(`/meeting/${meetingId}`);
    return response.data;
};

// 실시간 대시보드 조회 (인증 필요)
export const getTripDashboard = async (meetingId) => {
    const response = await tripApiInstance.get(
        `/meeting/${meetingId}/dashboard`,
    );
    return response.data;
};

// Payment API
export const createPayment = async (meetingId, paymentData) => {
    const response = await tripApiInstance.post(
        `/meeting/${meetingId}/payment`,
        paymentData,
    );
    return response.data;
};

export const getPayments = async (meetingId) => {
    const response = await tripApiInstance.get(`/meeting/${meetingId}/payment`);
    return response.data;
};

export const updatePayment = async (meetingId, paymentId, paymentData) => {
    const response = await tripApiInstance.put(
        `/meeting/${meetingId}/payment/${paymentId}`,
        paymentData,
    );
    return response.data;
};

export const deletePayment = async (meetingId, paymentId) => {
    const response = await tripApiInstance.delete(
        `/meeting/${meetingId}/payment/${paymentId}`,
    );
    return response.data;
};

// Member API
export const createMember = async (meetingId, memberData) => {
    const response = await tripApiInstance.post(
        `/meeting/${meetingId}/member`,
        memberData,
    );
    return response.data;
};

export const getMembers = async (meetingId) => {
    const response = await tripApiInstance.get(`/meeting/${meetingId}/member`);
    return response.data;
};

export const updateMember = async (meetingId, memberId, memberData) => {
    const response = await tripApiInstance.put(
        `/meeting/${meetingId}/member/${memberId}`,
        memberData,
    );
    return response.data;
};

export const deleteMember = async (meetingId, memberId) => {
    const response = await tripApiInstance.delete(
        `/meeting/${meetingId}/member/${memberId}`,
    );
    return response.data;
};

// Meeting 수정
export const updateMeeting = async (meetingId, meetingData) => {
    const response = await tripApiInstance.put(
        `/meeting/${meetingId}`,
        meetingData,
    );
    return response.data;
};

// 해외여행 정산 결과 조회 (인증 필요)
export const getTripSettlementResult = async (meetingId) => {
    const response = await tripApiInstance.get(
        `/meeting/${meetingId}/result/trip`,
    );
    return response.data;
};

// 공유 페이지용 정산 결과 조회 (인증 불필요, UUID 기반)
export const getTripResultByUuid = async (uuid) => {
    const response = await axios.get(
        `${TRIP_API_BASE_URL}/meeting/trip-page?uuid=${uuid}`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: false,
        },
    );
    return response.data;
};

// 공개용 정산 결과 조회 (인증 불필요, UUID 기반)
// 임시로 Supabase Functions 도메인 직접 사용
export const getPublicTripResult = async (uuid) => {
    const response = await axios.get(
        `${TRIP_API_BASE_URL}/meeting/share/trip?uuid=${uuid}`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: false,
        },
    );
    return response.data;
};

// 환율 조회 API
export const getExchangeRate = async (currency, date) => {
    const response = await tripApiInstance.get(
        `/common/exchange-rate?currency=${currency}&date=${date}`,
    );
    return response.data;
};

// 공금 추가 API
export const addBudget = async (meetingId, budgetData) => {
    const response = await tripApiInstance.post(
        `/meeting/${meetingId}/budget`,
        budgetData,
    );
    return response.data;
};

export default tripApiInstance;
