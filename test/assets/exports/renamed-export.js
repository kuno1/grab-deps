/*!
 * Test renamed export pattern
 * @version 1.0.0
 */

// 関数を定義
const func = () => {
    console.log('This is the renamed function');
    return 'renamed';
};

// 名前を変えてエクスポート
export { func as doSomething };

// 別の関数も定義してエクスポート
function internalFunction() {
    return 'internal';
}

export { internalFunction as publicFunction };
