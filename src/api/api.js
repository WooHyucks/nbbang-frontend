import Cookies from 'js-cookie';
import axios from 'axios';

export let Token = () => Cookies.get('authToken');

// 500 에러 발생 시 리다이렉트를 위한 플래그
let isRedirecting = false;

const axiosData = () => {
    const instance = axios.create({
        baseURL: 'https://qdvwwnylfhhevwzdfumm.supabase.co/functions/v1',
        headers: {
            Authorization: `Bearer ${Token()}`,
        },
    });

    // 응답 인터셉터: 500 에러 감지
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (
                error.response &&
                error.response.status === 500 &&
                !isRedirecting
            ) {
                isRedirecting = true;
                // 서버 에러 페이지로 리다이렉트
                window.location.href = '/server-error';
            }
            return Promise.reject(error);
        },
    );

    return instance;
};
//
// loging
export const PostLogData = (logData) => {
    return axiosData().post(`/log`, { data: logData });
};

// signd

export const postSignInData = (data) => {
    return axiosData().post('/user/sign-in', data);
};

export const postSignUpData = (data) => {
    return axiosData().post('/user/sign-up', data);
};

// user

export const getUserData = (query) => {
    return axiosData().get(query);
};
export const deleteUser = () => {
    return axiosData().delete(`/user`);
};

// guest
// 게스트 로그인은 토큰 없이 호출 가능하므로 별도 axios 인스턴스 사용
const axiosWithoutAuth = () => {
    const instance = axios.create({
        baseURL: 'https://qdvwwnylfhhevwzdfumm.supabase.co/functions/v1',
    });

    // 응답 인터셉터: 500 에러 감지
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (
                error.response &&
                error.response.status === 500 &&
                !isRedirecting
            ) {
                isRedirecting = true;
                // 서버 에러 페이지로 리다이렉트
                window.location.href = '/server-error';
            }
            return Promise.reject(error);
        },
    );

    return instance;
};

export const postGuestLogin = () => {
    return axiosWithoutAuth().post('/user/guest');
};

export const getGuestInfo = () => {
    return axiosData().get('/user/guest');
};

export const putGuestConvert = (data) => {
    return axiosData().put('/user/guest', data);
};

//meeting

export const getMeetingData = (query) => {
    return axiosData().get(query);
};

export const postMeetingrData = (query) => {
    return axiosData().post(query);
};

export const deleteMeetingData = (meetingId) => {
    return axiosData().delete(`/meeting/${meetingId}`);
};

export const PostSimpleSettlementData = () => {
    return axiosData().post('/meeting/simple');
};

export const getSimpleSettlementData = (meetingId) => {
    return axiosData().get(`/meeting/simple/${meetingId}`);
};

//meeting Fix

export const PutMeetingNameData = (meetingId, data) => {
    return axiosData().put(`meeting/${meetingId}`, data);
};

export const GetMeetingNameData = (meetingId) => {
    return axiosData().get(`meeting/${meetingId}`);
};

export const PatchSimpleSettlementData = (meetingId, data) => {
    return axiosData().patch(`/meeting/simple/${meetingId}`, data);
};

// member

export const getMemberData = (meetingId) => {
    return axiosData().get(`/meeting/${meetingId}/member`);
};

export const postMemberData = (meetingId, data) => {
    return axiosData().post(`/meeting/${meetingId}/member`, data);
};

export const deleteMemberData = (meetingId, memberId) => {
    return axiosData().delete(`/meeting/${meetingId}/member/${memberId}`);
};

//memnber fix

export const PutMemberNameData = (meetingId, Id, data) => {
    return axiosData().put(`meeting/${meetingId}/member/${Id}`, data);
};

//payment

export const getPaymentData = (meetingId) => {
    return axiosData().get(`meeting/${meetingId}/payment`);
};

export const postPaymentData = (meetingId, data) => {
    return axiosData().post(`meeting/${meetingId}/payment`, data);
};

export const deletePaymentData = (meetingId, paymentId) => {
    return axiosData().delete(`/meeting/${meetingId}/payment/${paymentId}`);
};

export const putPaymentData = (meetingId, paymentId, data) => {
    return axiosData().put(`/meeting/${meetingId}/payment/${paymentId}`, data);
};

export const putPaymentOrderData = (meetingId, order_data) => {
    return axiosData().put(`/meeting/${meetingId}/payment/order`, order_data);
};
//Billing

export const getBillingData = (meetingId) => {
    return axiosData().get(`/meeting/${meetingId}/billing`);
};

//BillingResult

export const getBillingResultText = (meeting_id) => {
    return axiosData().get(`/meeting/${meeting_id}/share/link`);
};

export const getBillingResultLink = (meeting_id) => {
    return axiosData().get(`/meeting/${meeting_id}/share/link`);
};

export const getBillingResultPage = (meeting_id) => {
    return axiosData().get(`/meeting/share-page?uuid=${meeting_id}`);
};

export const putBillingTossBank = (meetingId, data) => {
    return axiosData().put(`/meeting/${meetingId}`, data);
};

export const putBillingFixTossBank = (data) => {
    return axiosData().put('/user', data);
};

//Deposit

export const PatchBillingUserKaKaoDeposit = (data) => {
    return axiosData().put(`user/kakao-deposit-id`, data);
};

export const PatchBillingMeetingKakaoDeposit = (meetingId, data) => {
    return axiosData().put(`meeting/${meetingId}/kakao-deposit-id`, data);
};

export const PatchBillingUserTossDeposit = (data) => {
    return axiosData().put(`user/bank-account`, data);
};
export const PatchBillingMeetingTossDeposit = (meetingId, data) => {
    return axiosData().put(`meeting/${meetingId}/bank-account`, data);
};

// imges uploade

export const PostImagesUpoloader = (meetingId, data) => {
    return axiosData().post(`meeting/${meetingId}/images`, data);
};

export const PatchImagesUpoloader = (meetingId, data) => {
    return axiosData().patch(`meeting/${meetingId}/images`, data);
};

// common API
export const getCountries = () => {
    return axiosData().get('/common/countries');
};

export const getExchangeRate = (currency) => {
    if (!currency) {
        throw new Error('currency parameter is required');
    }
    return axiosData().get(`/common/exchange-rate?currency=${currency}`);
};
