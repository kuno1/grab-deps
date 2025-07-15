/*!
 * Test file with both @deps and imports
 * @handle test-mixed-deps
 * @deps jquery, wp-blocks
 */

import { __ } from "@wordpress/i18n";
import { useState } from "@wordpress/element";

console.log(__('Hello World'));
const [state, setState] = useState(false);
