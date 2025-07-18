/*!
 * App module that uses date utilities
 * @version 1.0.0
 */

import { formatDate, parseDate } from '@testns/js/modules/date-utils';
import { helper } from './helper.js';  // 相対パス - webpack でバンドルされる

console.log('App module loaded');

export const initApp = () => {
    const today = new Date();
    console.log('Today:', formatDate(today));

    const parsed = parseDate('2023-01-15');
    console.log('Parsed:', parsed);
};

export const getAppVersion = () => {
    return '1.0.0';
};
