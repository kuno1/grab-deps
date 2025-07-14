/*!
 * Test file with duplicate dependencies
 * @handle test-duplicate-deps
 * @deps wp-i18n, jquery, wp-element
 */

import { __ } from "@wordpress/i18n";
import { useState } from "@wordpress/element";

console.log(__('Hello World'));
const [state, setState] = useState(false);
