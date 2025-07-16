/*!
 * Test inline default export patterns
 * @version 1.0.0
 */

// インライン関数のデフォルトエクスポート（匿名関数）
export default () => {
    console.log('Anonymous default function');
    return 'anonymous result';
};

// 名前付きエクスポートも併用
export const namedExport = 'named value';
