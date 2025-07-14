/*!
 * Helper utility functions
 * @version 1.0.0
 */

export const helper = {
    log: (message) => {
        console.log(`[Helper] ${message}`);
    },

    capitalize: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};
