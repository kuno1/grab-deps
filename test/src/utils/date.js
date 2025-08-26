/*!
 * Mock date utilities for testing
 * @version 1.0.0
 */

export const moment = (date) => {
    return {
        format: (format) => new Date(date).toLocaleDateString(),
        add: (amount, unit) => new Date(date),
        subtract: (amount, unit) => new Date(date),
    };
};

export const formatDate = (date, format) => {
    return new Date(date).toLocaleDateString();
};

export default {
    moment,
    formatDate,
};
