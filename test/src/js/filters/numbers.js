/*!
 * Number formatting filters
 * @version 1.0.0
 */

export const numberFormat = (number, withDecimal = true) => {
    return withDecimal ? number.toFixed(2) : Math.round(number);
};

export const moneyFormat = (number, currency = 'usd') => {
    const formatted = numberFormat(number, true);
    return currency === 'usd' ? `$${formatted}` : `${formatted} ${currency}`;
};
