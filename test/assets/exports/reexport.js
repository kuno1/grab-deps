/*!
 * Test re-export patterns
 * @version 1.0.0
 */

// Re-export from another module
export { formatDate, parseDate } from '../modules/date-utils';

// Re-export with renaming
export { default as DateUtils } from '../modules/date-utils';

// Own exports
export const reexportHelper = () => 'reexport helper';
