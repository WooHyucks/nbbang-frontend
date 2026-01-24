import { axiosData } from './api';

/**
 * 영수증 이미지를 AI로 분석하고 즉시 정산을 생성하는 API 호출
 * @param {FormData} formData - images, prompt 포함된 FormData
 * @returns {Promise<Object>} - 생성된 Meeting 객체 { meeting: {...} }
 */
export const analyzeAndCreateMeeting = async (formData) => {
    try {
        const response = await axiosData().post('/ai/settlement', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.error('AI 정산 생성 실패:', error);
        throw error;
    }
};

/**
 * 영수증 이미지를 AI로 분석하는 API 호출 (하위 호환성 유지)
 * @deprecated analyzeAndCreateMeeting 사용 권장
 */
export const analyzeReceipt = async (files = [], prompt = '') => {
    try {
        const formData = new FormData();

        // 이미지 파일들을 FormData에 추가 (있는 경우)
        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append('images', file);
            });
        }

        // 프롬프트 추가 (필수)
        if (prompt && prompt.trim()) {
            formData.append('prompt', prompt.trim());
        }

        // API 호출
        const response = await axiosData().post('/ai/settlement', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.error('AI 분석 실패:', error);
        throw error;
    }
};

