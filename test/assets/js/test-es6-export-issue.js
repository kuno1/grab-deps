/*!
 * Test file for ES6 export issue reproduction
 * @deps jquery
 */

export const numberFormat = (number, withDecimal = true) => {
    const numberString = ('' + number).split('.');
    const integerPart = numberString[0];
    const decimalPart = numberString[1] || '';

    // Add thousand separators
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (withDecimal && decimalPart) {
        return formattedInteger + '.' + decimalPart;
    }

    return formattedInteger;
};

export const moneyFormat = (number, currency = 'usd') => {
    const formatted = numberFormat(number, true);
    const symbols = {
        usd: '$',
        eur: '€',
        jpy: '¥'
    };

    const symbol = symbols[currency.toLowerCase()] || '$';
    return symbol + formatted;
};

export default {
    numberFormat,
    moneyFormat
};
