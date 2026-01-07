import { CURRENCY_MAP } from '../types/trip.js';

/**
 * 국가 코드에 따라 통화 기호와 포맷을 반환
 */
export const getCurrencyInfo = (countryCode) => {
    const currency = CURRENCY_MAP[countryCode] || 'KRW';

    const currencySymbols = {
        JPY: '¥',
        USD: '$',
        CNY: '¥',
        GBP: '£',
        EUR: '€',
        THB: '฿',
        VND: '₫',
        PHP: '₱',
        SGD: 'S$',
        MYR: 'RM',
        IDR: 'Rp',
        AUD: 'A$',
        NZD: 'NZ$',
        CAD: 'C$',
        KRW: '₩',
    };

    return {
        code: currency,
        symbol: currencySymbols[currency] || currency,
    };
};

/**
 * 금액을 통화 형식으로 포맷팅
 * @param {number} amount 금액
 * @param {string} countryCode 국가 코드 (예: 'JP', 'US')
 * @param {Object} options 포맷 옵션
 */
export const formatCurrency = (amount, countryCode, options = {}) => {
    const { code, symbol } = getCurrencyInfo(countryCode);
    const { showSymbol = true, showDecimals } = options;

    // JPY, KRW 등은 소수점 없음
    const useDecimals =
        showDecimals !== undefined
            ? showDecimals
            : !['JPY', 'KRW', 'VND'].includes(code);

    const formatted = new Intl.NumberFormat('ko-KR', {
        style: 'decimal',
        minimumFractionDigits: useDecimals ? 2 : 0,
        maximumFractionDigits: useDecimals ? 2 : 0,
    }).format(amount);

    if (showSymbol) {
        // 통화 기호 위치 (일부는 뒤에)
        if (['KRW', 'JPY'].includes(code)) {
            return `${formatted}${symbol}`;
        }
        return `${symbol}${formatted}`;
    }

    return formatted;
};

/**
 * 원화를 외화로 변환
 * @param {number} krwAmount 원화 금액
 * @param {number} exchangeRate 환율 (1원 = exchangeRate 외화)
 */
export const convertKRWToForeign = (krwAmount, exchangeRate) => {
    return krwAmount * exchangeRate;
};

/**
 * 외화를 원화로 변환
 * @param {number} foreignAmount 외화 금액
 * @param {number} exchangeRate 환율 (1원 = exchangeRate 외화)
 */
export const convertForeignToKRW = (foreignAmount, exchangeRate) => {
    return foreignAmount / exchangeRate;
};



