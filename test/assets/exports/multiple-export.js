/*!
 * Test multiple export patterns
 * @version 1.0.0
 */

// オブジェクトから複数のメソッドをエクスポート
const MyClass = {
    methodA: () => 'Method A',
    methodB: () => 'Method B',
    methodC: () => 'Method C'
};

// 複数のエクスポート（分割代入ではなく、個別のエクスポート）
export { MyClass };
export const methodA = MyClass.methodA;
export const methodB = MyClass.methodB;

// 一度に複数をエクスポート
export {
    methodA as exportedMethodA,
    methodB as exportedMethodB
} from './MyClass';

// 変数を定義してエクスポート
const utilityFunction = (x) => x * 2;
const helperFunction = (x) => x + 1;

export { utilityFunction, helperFunction };
