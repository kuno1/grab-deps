/*!
 * Date utility functions
 * @version 1.0.0
 */

export const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

export const parseDate = (dateString) => {
    return new Date(dateString);
};

export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export default {
    formatDate,
    parseDate,
    addDays
};
