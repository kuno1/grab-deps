/*!
 * Test default export patterns
 * @version 1.0.0
 */

// 関数式のデフォルトエクスポート
const myFunc = () => {
    console.log('This is the default function');
    return 'default result';
};

export default myFunc;

// 名前付きエクスポートも併用
export const helperFunction = () => 'helper';
export const VERSION = '1.0.0';
