/*!
 * Test build block JSX
 *
 * @handle test-build-block
 * @version 1.0.0
 * @deps wp-element
 */

import { createElement } from '@wordpress/element';

export const TestBlock = () => {
    return createElement('div', {}, 'Test Block');
};

export default TestBlock;
