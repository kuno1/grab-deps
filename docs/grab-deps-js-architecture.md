# grab-deps js アーキテクチャ解説

## 概要

`grab-deps js`は、@wordpress/scriptsの機能を拡張して、ES6 moduleのexportとimportを自動的にWordPress環境で利用可能な形式に変換する高度なJavaScriptコンパイルシステムです。

## 基本的な処理フロー

```
1. ソースファイルの収集とグループ化
2. wp-scripts buildの実行
3. asset.phpファイルの解析と依存関係情報の取得
4. blocksディレクトリとasset.phpファイルの削除
5. ES6 exportの問題解決処理（オプション）
6. グローバル登録コードの生成と追加（オプション）
7. license.txtの生成
```

## 主要機能

### 1. ES6 Export問題の解決（オプション）

**設定**: `globalExportGeneration: true`が必要

@wordpress/scriptsでES6 moduleのexportのみを含むファイルがコンパイルされた場合、空のファイルになることがあります。この機能を有効にすると、自動的に修正されます。

```javascript
// 元のファイル（ES6 module）
export const myFunction = () => {
    return 'Hello World';
};

export default myFunction;

// 結果（ブラウザで動作する形式）
const myFunction = () => {
    return 'Hello World';
};

const defaultExport = myFunction;

// グローバル登録コードも自動追加
window.mylib = window.mylib || {};
window.mylib.utils = window.mylib.utils || {};
window.mylib.utils.helper = myFunction;
```

### 2. グローバル登録システム（オプション）

**設定**: `globalExportGeneration: true`および`namespace`の設定が必要

ES6 moduleのexportを名前空間付きのグローバルオブジェクトとして利用可能にします。

```javascript
// ファイル: src/components/ui.js
// 名前空間: mylib

// 元のファイル
export const Button = () => { /* ... */ };
export const Modal = () => { /* ... */ };

// 結果: 以下のグローバルオブジェクトが利用可能
window.mylib.components.ui.Button
window.mylib.components.ui.Modal
```

### 3. フォルダーベースのハンドル名生成（オプション）

**設定**: `autoHandleGeneration: true`および`namespace`の設定が必要

ファイルのフォルダー構造に基づいて自動的にハンドル名を生成します。

```javascript
// ファイル構造
src/
├── utils/
│   └── date.js
└── components/
    └── ui.js

// 結果: 以下のハンドル名が生成されます
// src/utils/date.js → "mylib-utils-date"
// src/components/ui.js → "mylib-components-ui"
```

### 5. 依存関係の自動処理

wp-scripts buildが生成するasset.phpファイルから依存関係を抽出し、license.txtに統合します。

```javascript
// asset.phpファイルの内容
array('dependencies' => array('wp-element', 'wp-components'))

// 結果: license.txtに依存関係情報が含まれます
/*!
 * @deps wp-element, wp-components
 */
```

## 設定オプション

### 必須設定
- `namespace`: 名前空間プレフィックス（例: "mylib"）

### オプション設定
- `srcDir`: ソースディレクトリ（デフォルト: "src"）
- `autoHandleGeneration`: フォルダーベースのハンドル名生成を有効化
- `globalExportGeneration`: グローバル登録コードの生成を有効化

### 設定例

```json
{
    "namespace": "mylib",
    "srcDir": "src",
    "autoHandleGeneration": true,
    "globalExportGeneration": true
}
```

## 利用例

### 基本的な使用方法
```bash
# 基本的なコンパイル
npx grab-deps js src/js dist/js

# 設定ファイルを指定
npx grab-deps js src/js dist/js --config .grab-deps.json
```

### 高度な使用例
```bash
# 複数の拡張子を指定
npx grab-deps js src/js dist/js js,jsx,ts

# 特定の設定でのコンパイル
npx grab-deps js src/components dist/components --config components.grab-deps.json
```

## 技術的な特徴

1. **webpack.config.jsのオーバーライド**: @wordpress/scriptsの標準設定を拡張
2. **ES6 Module互換性**: ES6 exportの問題を自動解決
3. **グローバル登録**: 名前空間付きのグローバルアクセスを提供
4. **依存関係の自動管理**: asset.phpからの依存関係抽出とlicense.txtへの統合
5. **階層構造の保持**: ソースディレクトリの構造を保持してコンパイル

## 注意事項

- @wordpress/scriptsがインストールされている必要があります
- Node.js 18.0.0以上が必要です
- ES6 exportの自動変換は、globalExportGenerationが有効な場合のみ動作します

## トラブルシューティング

### ES6 exportファイルが空になる場合
- globalExportGenerationをtrueに設定してください
- namespaceとsrcDirが正しく設定されているか確認してください

### 依存関係が正しく取得されない場合
- asset.phpファイルが正しく生成されているか確認してください
- wp-scriptsのバージョンが最新であることを確認してください
