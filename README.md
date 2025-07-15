# @kunoichi/grab-deps

A toolset to extract dependencies information from js/css files in WordPress Development.

[日本語（Japanese）](https://github.com/kuno1/grab-deps/wiki/README-ja) is also available.

[![TEST](https://github.com/kuno1/grab-deps/actions/workflows/npm.yml/badge.svg)](https://github.com/kuno1/grab-deps/actions/workflows/npm.yml)

This library dump `wp-dependencies.json` which includes dependencies and path information about js/css.

- You don't have to specify dependencies from php files.
- You can automate the registration & enqueue of assets.

## Installation

```bash
npm install @kunoichi/grab-deps
```

## Usage

Suppose that the directory structure of your theme/plugin is like below:

```bash
assets
- js
  - main.js
- css
  - style.css
```

Define tasks below in your [npm scripts](https://docs.npmjs.com/misc/scripts) or [gulpfile.js](https://gulpjs.com/).

### NPM Scripts

Since version 2.0.0, CLI inter face is available.
If you need traspiling JavaScripts with [@wordpress/scripts](https://www.npmjs.com/package/@wordpress/scripts), add dependencies.

```json
{
	"dependencies": {
		"@kunoichi/grab-deps": "^2.0.0",
		"@wordpress/sripts": "^27.0.0"
	},
	"scripts": {
		"dump": "grab-deps dump assets",
		"transpile": "grab-deps js src/js assets/js"
  }
}
```

`grab-deps-image 'test/src/images/**/*.{jpg,png,gif,svg}' test/dist/images` is also available. See peer dependencies for more information.

### Gulp

```js
// gulpfile.js
const gulp = require( 'gulp' );
const { dumpSetting } = require('@kunoichi/grab-deps');

// Dump task.
gulp.task( 'dump', function( done ) {
  dumpSetting( 'assets' );
  done();
} );

// Watch assets directory.
gulp.task( 'watch', function () {
  // Watch assets change and dump.
  gulp.watch( [ 'assets/**/*.css', 'assets/**/*.js' ], gulp.task( 'dump' ) );
} );
```

Now you can get updated dump information whatever changes you made for assets directory.

## Register Assets in WordPress

Suppose that you have `assets/js/app.js` in your theme folder.
Add @params in license comment.

```js
/*!
 * My Plugin main JS
 * 
 * @handle my-plugin-app
 * @version 2.1.0
 * @footer false
 * @deps jquery, jquery-masonry, wp-i18n
 */
console.log( 'This script runs jQuery Masonry.' );
```

After adding @params to the license comment, run the script you set up earlier.
```
npm run dump
```
And you can get setting file `wp-dependencies.json` like this.


```json
[
  {
    "handle": "my-plugin",
    "version": "2.1.0",
    "path": "assets/js/app.js",
    "hash": "5e84fd5b5817a6397aeef4240afeb97a",
    "deps": [ "jquery", "jquery-masonry", "wp-i18n" ],
    "ext": "js",
    "footer": true,
    "media": "all"
  }
]
```

Now you can bulk register assets through php.

```php
// This code is in your theme's functions.php
add_action( 'init', function() {
    // Load setting as array.
    $settings = json_decode( file_get_contents( __DIR__ . '/wp-dependencies.json' ), true );
    // Register each setting.
    foreach ( $settings as $setting ) {
        $handle  = $setting['handle'];
        $version = $setting['hash']; // You can also specify @version
        $url     = get_template_directory_uri() . '/' . $setting['path'];
        if ( 'js' === $setting['ext'] ) {
            // Register JavaScript.
            $script_setting = [
            	'in_footer' => $setting['footer'],
            ];
            if ( in_array( $setting['strategy'], [ 'async', 'defer' ], true ) ) {
            	$script_setting['strategy'] = $setting['strategy'];
            }
            wp_register_script( $handle, $url, $setting['deps'], $version, $script_setting );
            // You can do extra settings here.
						// For example, set script translation.
						if ( in_array( 'wp-i18n', $setting['deps'], true ) ) {
							wp_set_script_translation();
						}
        } else {
            // This is CSS.
            wp_register_style( $handle, $url, $setting['deps'], $version, $setting['media'] ); 
        }
    }
} );
```

Now you can enqueue any of your scripts/styles with `wp_enqueue_script( 'my-app-js' )` or `wp_enqueue_style( 'my-blocks-alert-css' )`.

## ES Module Support (v3.0.0+)

Since version 3.0.0, grab-deps supports ES Module format with automatic global registration code generation. This feature enables you to write modern JavaScript modules while maintaining WordPress compatibility.

### Benefits

- **Better Development Experience**: Write standard ES Module syntax
- **Test-Friendly**: Easy mocking and testing with Jest and other testing frameworks
- **IDE Support**: Full autocomplete, type checking, and refactoring support
- **Single Codebase**: Use the same code for development/testing (ES Modules) and production (global variables)

### Configuration

Add configuration to your `package.json`:

```json
{
  "grabDeps": {
    "namespace": "mylib",
    "srcDir": "src",
    "autoHandleGeneration": true,
    "autoImportDetection": true,
    "globalExportGeneration": true
  }
}
```

#### Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `namespace` | Yes | Namespace prefix for your library (e.g., "mylib" for `@mylib/utils/date`) |
| `srcDir` | No | Source directory (default: "src") |
| `autoHandleGeneration` | No | Auto-generate handle names based on folder structure |
| `autoImportDetection` | No | Auto-detect namespace imports and add as dependencies |
| `globalExportGeneration` | No | Generate global registration code for ES modules |

### Writing ES Modules

Write your JavaScript in standard ES Module format:

```javascript
// src/utils/date.js
/*!
 * Date utility functions
 * @version 1.0.0
 */

export const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

export const parseDate = (dateString) => {
    return new Date(dateString);
};

export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export default {
    formatDate,
    parseDate,
    addDays
};
```

### Using Namespace Imports

Import modules using your configured namespace:

```javascript
// src/app.js
/*!
 * Main application
 * @version 1.0.0
 */

import { formatDate, parseDate } from '@mylib/utils/date';
import { helper } from './helper.js';  // Relative imports work normally

export const initApp = () => {
    const today = new Date();
    console.log('Today:', formatDate(today));
    
    const parsed = parseDate('2023-01-15');
    console.log('Parsed:', parsed);
};

export const getAppVersion = () => {
    return '1.0.0';
};
```

### Generated Output

When you run `grab-deps dump`, the tool will:

1. **Auto-generate handle names** based on folder structure:
   - `src/utils/date.js` → `mylib-utils-date`
   - `src/app.js` → `mylib-app`

2. **Auto-detect dependencies** from namespace imports:
   - `@mylib/utils/date` → `mylib-utils-date` dependency

3. **Generate global registration code** for browser compatibility:

```javascript
// Auto-generated global registration code
window.mylib = window.mylib || {};
window.mylib.utils = window.mylib.utils || {};
window.mylib.utils.date = Object.assign(window.mylib.utils.date || {}, {
    formatDate: formatDate,
    parseDate: parseDate,
    addDays: addDays
});
window.mylib.utils.date.default = window.mylib.utils.date.default || {};
```

### JSON Output Example

```json
[
  {
    "handle": "mylib-utils-date",
    "path": "src/utils/date.js",
    "ext": "js",
    "version": "1.0.0",
    "deps": [],
    "footer": true,
    "media": "all",
    "strategy": "",
    "hash": "abc123...",
    "globalRegistration": "// Global registration code here..."
  },
  {
    "handle": "mylib-app",
    "path": "src/app.js",
    "ext": "js",
    "version": "1.0.0",
    "deps": ["mylib-utils-date"],
    "footer": true,
    "media": "all",
    "strategy": "",
    "hash": "def456...",
    "globalRegistration": "// Global registration code here..."
  }
]
```

### WordPress Integration

The generated global registration code can be included in your WordPress theme/plugin to make ES modules available as global variables:

```php
// In your theme/plugin
add_action('wp_enqueue_scripts', function() {
    $settings = json_decode(file_get_contents(__DIR__ . '/wp-dependencies.json'), true);
    
    foreach ($settings as $setting) {
        // Register the script normally
        wp_register_script(
            $setting['handle'],
            get_template_directory_uri() . '/' . $setting['path'],
            $setting['deps'],
            $setting['version'],
            ['in_footer' => $setting['footer']]
        );
        
        // Add global registration code if available
        if (!empty($setting['globalRegistration'])) {
            wp_add_inline_script($setting['handle'], $setting['globalRegistration'], 'after');
        }
    }
});
```

### Development Workflow

1. **Write ES Modules**: Use standard `export`/`import` syntax
2. **Run Tests**: Use Jest or other testing frameworks directly on ES modules
3. **Build for Production**: `grab-deps` generates WordPress-compatible global variables
4. **Deploy**: WordPress loads scripts with global registration code

This approach gives you the best of both worlds: modern development experience with ES modules and WordPress compatibility through global variables.

## Supported Header Info

| Name      | Default                              | type    | Target | Possible Values |
|-----------|--------------------------------------|---------|--------|-----------------|
| @version  | 0.0.0                                | String  | both   | 1.0.0           |
| @handle   | Base file name without extension     | String  | both   | my-script       |
| @deps     | Empty                                | Array   | both   | [jquery, my-js] |
| @footer   | True                                 | Boolean | js     | true or false   |
| @strategy | Empty                                | String  | css    | defer,async     |
| @media    | all                                  | String  | css    | screen, print   |
| @cssmedia | Same as `@media`. Avoid media query. | String  | css    | screen, print   |

> [!TIP]
> 1. All file will have `hash` property. This is md5 hash of file content and is useful and handy for `version` argument of `wp_register_(script|style)`.
> 2. If your CSS includes media query and grab-deps parsed it unintentionally, you can use `@cssmedia` to avoid it.


### JSON Example

```json
[
	{
		"path": "assets/js/app.js",
		"version": "0.0.0",
		"deps": [
			"jquery",
			"wp-api-fetch"
		],
		"hash": "900150983cd24fb0d6963f7d28e17f72",
		"strategy": "defer",
		"footer": true,
		"handle": "my-app"
	},
	{
		"path": "assets/css/style.css",
		"version": "0.0.0",
		"deps": [ "bootstrap" ],
		"hash": "900150983cd24fb0d6963f7d28e17f72",
		"media": "screen",
		"handle": "my-style"
	}
]
```

### License text

Nowadays, some compilers/transpilers like [webpack](https://webpack.js.org/plugins/terser-webpack-plugin/) extract license comments. If original is like below:

```js
/*!
 * Main app file.js
 *
 * @version 2.0.0
 */
console.log( 'Start rendering!' );
```

`file.js` will compiled like below:

```js
console.log('Start rendering!');
```

And in same directory, `file.js.LICENSE.txt` will be exported.

```js
/*!
 * Main app file.js
 *
 * @version 2.0.0
 */
```

In such case, `@kunoichi/grab-deps` will support `.LISENCE.txt` format by default. 3rd argument `suffix` of `dumpSetting` supports other format.

```js
// If your JS license will be in `app.js.txt`,
// You can set suffix.
dumpSetting( 'assets', './wp-dependencies.json', '.txt' );
// If your licenses will be other format, specify function.
dumpSetting( 'assets', './wp-dependencies.json', function( path ) {
  // Convert path to your license.txt
  return licensePath;
} );
```

---

<p style="text-align: center;">
&copy; 2019 <a href="https://tarosky.co.jp">TAROSKY</a>
</p>
