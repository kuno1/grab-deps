/*!
 * Test file for import statement handling
 * @version 1.0.0
 * @deps testns-utils-date, testns-js-very-deep-util
 */

import { helper } from './utils/helper.js';  // 相対パス - webpack でバンドルされる
import { component } from '../components/ui.js';  // 相対パス - webpack でバンドルされる
import axios from 'axios';  // 外部ライブラリ - 無視される
import { useState } from 'react';  // 外部ライブラリ - 無視される

// Use standard WordPress-style global access
const { moment } = testns.utils.date;
const { deepUtil } = testns.js.very.deep.util;

console.log('Testing import statement handling');
