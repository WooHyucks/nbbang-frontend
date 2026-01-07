import React from 'react';
import { formatCurrency } from '../../utils/currencyFormatter';

const CurrencyFormatter = ({
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



