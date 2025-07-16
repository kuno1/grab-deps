/*!
 * Test ES6 exports with global registration
 * @version 1.0.0
 */

/**
 * Format number.
 * @param {number} number
 * @param {boolean} withDecimal
 * @return {string} Formatted number string.
 */
export const numberFormat = (number, withDecimal = true) => {
    const numberString = ('' + number).split('.');
    const out = [];
    let integer = '';
    for (let i = 1; i <= numberString[0].length; i++) {
        integer = numberString[0].substr(-1 * (i), 1) + integer;
        if (0 === i % 3 && numberString[0].length > i) {
            integer = ',' + integer;
        }
    }
    out.push(integer);
    if (withDecimal) {
        if (1 < numberString.length) {
            out.push(numberString[1]);
        } else {
            out.push('00');
        }
    }
    return out.join('.');
};

/**
 * Format number to money.
 * @param {number} number
 * @param {string} currency
 * @return {string} Formatted money string.
 */
export const moneyFormat = (number, currency = 'usd') => {
    let prefixLetter = '';
    switch (currency.toLowerCase()) {
        case 'jpy':
            prefixLetter = '¥';
            break;
        case 'usd':
            prefixLetter = '$';
            break;
    }
    const formattedNumber = numberFormat(number, currency !== 'jpy');
    return prefixLetter ? prefixLetter + formattedNumber : formattedNumber;
};
