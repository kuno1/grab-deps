/**
 * @deps jquery, wp-blocks
 * @handle test-mixed-deps
 */

// Mixed dependencies test file - has both @deps comment and imports
import { __ } from '@wordpress/i18n';
import { createElement } from '@wordpress/element';

// Manual deps: jquery, wp-blocks
// Import deps: wp-i18n, wp-element
// Expected combined: jquery, wp-blocks, wp-element, wp-i18n

const message = __('Mixed dependencies test', 'test-domain');
const element = createElement('div', { className: 'test-mixed' }, message);

console.log('Mixed dependencies loaded:', { element });

export default element;
