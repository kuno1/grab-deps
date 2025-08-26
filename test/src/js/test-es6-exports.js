/*!
 * Test ES6 exports (multiple)
 *
 * @handle test-es6-exports
 * @version 1.0.0
 */

// This file tests multiple ES6 export patterns
export const namedExport1 = 'test1';
export const namedExport2 = 'test2';

export function exportedFunction() {
    return 'function export';
}

const defaultValue = {
    prop1: 'value1',
    prop2: 'value2'
};

export default defaultValue;
