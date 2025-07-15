/*!
 * Test file with WordPress imports
 * @handle test-wp-imports
 */

import { __ } from "@wordpress/i18n";
import { useState } from "@wordpress/element";
import { apiFetch } from "@wordpress/api-fetch";

console.log(__('Hello World'));
const [state, setState] = useState(false);
