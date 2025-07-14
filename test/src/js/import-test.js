/*!
 * Test file for import statement handling
 * @version 1.0.0
 */

import { helper } from './utils/helper.js';  // 相対パス - webpack でバンドルされる
import { component } from '../components/ui.js';  // 相対パス - webpack でバンドルされる
import { moment } from '@testns/utils/date';  // 名前空間 - 依存関係として解決される
import { deepUtil } from '@testns/js/very/deep/util';  // 名前空間 - 依存関係として解決される
import axios from 'axios';  // 外部ライブラリ - 無視される
import { useState } from 'react';  // 外部ライブラリ - 無視される

console.log('Testing import statement handling');
