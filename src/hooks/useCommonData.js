import { useQuery } from '@tanstack/react-query';
import { getCountries, getExchangeRate } from '../api/api';

/**
 * 전역 데이터 관리 Hook
 * 국가 정보와 환율 정보를 효율적으로 관리
 */
export const useCommonData = () => {
    // 국가 목록 조회 (staleTime: Infinity로 설정하여 앱 사용 중 불필요한 재요청 방지)
    const {
        data: countries = [],
        isLoading: isLoadingCountries,
        error: countriesError,
    } = useQuery({
        queryKey: ['countries'],
        queryFn: async () => {
            const response = await getCountries();
            return response.data;
        },
        staleTime: Infinity,
        gcTime: Infinity, // v5에서는 cacheTime 대신 gcTime 사용
    });

    /**
     * 국가 코드로 국가 정보 조회
     */
    const getCountryByCode = (countryCode) => {
        return countries.find((c) => c.code === countryCode);
    };

    /**
     * 특정 통화의 환율 조회 (필요할 때만 호출)
     * @param {string} currency - 통화 코드 (예: 'USD', 'JPY')
     * @returns {Promise<number>} 환율 (1 currency = ? KRW)
     */
    const getExchangeRateByCurrency = async (currency) => {
        if (!currency || currency === 'KRW') {
            return 1.0;
        }
        try {
            const response = await getExchangeRate(currency);
            return response.data.rate || null;
        } catch (error) {
            console.error('환율 조회 실패:', error);
            return null;
        }
    };

    /**
     * 국가 코드로 환율 조회 (비동기)
     * @param {string} countryCode - 국가 코드 (예: 'US', 'JP')
     * @returns {Promise<number>} 환율
     */
    const getExchangeRateByCountry = async (countryCode) => {
        const country = getCountryByCode(countryCode);
        if (!country || !country.currency) {
            return null;
        }
        return await getExchangeRateByCurrency(country.currency);
    };

    return {
        countries,
        isLoading: isLoadingCountries,
        error: countriesError,
        getCountryByCode,
        getExchangeRateByCurrency,
        getExchangeRateByCountry,
    };
};
