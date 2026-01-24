/**
 * API Base URL 설정
 * 환경 변수 또는 기본값 사용
 * 한 곳에서 수정하면 모든 API에 적용됩니다.
 */

// 환경 변수에서 가져오거나 기본값 사용
// VITE_ 접두사는 Vite 환경 변수 규칙입니다
export const BASE_URL =
    'https://qdvwwnylfhhevwzdfumm.supabase.co/functions/v1';

// 프로덕션 URL (주석 해제하여 사용)
// const API_BASE_URL = 'https://qdvwwnylfhhevwzdfumm.supabase.co/functions/v1';

// 개발 환경 확인
// export const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

