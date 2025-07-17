/*!
 * Toast notification plugin
 * @version 1.0.0
 */

export const showToast = (message, type = 'info') => {
    console.log(`Toast: ${message} (${type})`);
};

export const hideToast = () => {
    console.log('Toast hidden');
};
