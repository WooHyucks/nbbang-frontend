import React from 'react';
import { formatCurrency } from '../../utils/currencyFormatter';

interface CurrencyFormatterProps {
    amount: number;
    countryCode: string;
    showSymbol?: boolean;
    showDecimals?: boolean;
    className?: string;
}

/**
 * 국가 코드를 입력받아 해당 국가의 심볼과 포맷으로 금액을 변환하는 컴포넌트
 */
export const CurrencyFormatter: React.FC<CurrencyFormatterProps> = ({
    amount,
    countryCode,
    showSymbol = true,
    showDecimals,
    className = '',
}) => {
    const formatted = formatCurrency(amount, countryCode, {
        showSymbol,
        showDecimals,
    });

    return <span className={className}>{formatted}</span>;
};

export default CurrencyFormatter;



