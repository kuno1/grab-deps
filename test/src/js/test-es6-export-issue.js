/*!
 * Test ES6 export issue
 *
 * @handle test-es6-export-issue
 * @version 1.0.0
 */

// This file contains only ES6 exports which can cause empty compiled files
export const exportedFunction = () => {
    return 'This should not result in an empty file';
};

export const anotherExport = {
    test: 'value'
};

export default exportedFunction;
