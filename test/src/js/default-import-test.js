/*!
 * Default import test
 * @version 1.0.0
 */

import list from '@testns/js/components/list';
import { helper } from './utils/helper.js';

export const renderList = (items) => {
    return list(items);
};

export const testDefaultImport = () => {
    const items = [
        { text: 'Item 1' },
        { text: 'Item 2' },
        { text: 'Item 3' }
    ];

    return renderList(items);
};
