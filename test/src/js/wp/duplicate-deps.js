/**
 * @deps wp-i18n, jquery, wp-element
 * @handle test-duplicate-deps
 */

// Duplicate dependencies test file - has overlapping deps between @deps and imports
import { __ } from '@wordpress/i18n';
import { createElement } from '@wordpress/element';

// Manual deps: wp-i18n, jquery, wp-element
// Import deps: wp-i18n, wp-element
// Expected combined (duplicates removed): wp-i18n, jquery, wp-element

const message = __('Duplicate dependencies test', 'test-domain');
const element = createElement('span', { className: 'test-duplicate' }, message);

console.log('Duplicate dependencies handled:', { element });
