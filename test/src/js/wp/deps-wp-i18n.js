/**
 * @deps wp-api-fetch, wp-element, wp-i18n
 * @handle test-wp-imports
 */

// WordPress imports test file
import { __ } from '@wordpress/i18n';
import { createElement } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const message = __('Hello, world!', 'test-domain');
const element = createElement('div', null, message);

console.log('WordPress dependencies loaded:', { __, createElement, apiFetch });
