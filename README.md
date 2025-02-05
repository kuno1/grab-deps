# grab-deps

WordPress library to extract dependencies information from js/css files.

![TEST](https://github.com/kuno1/grab-deps/workflows/Grab%20deps%20test./badge.svg?branch=master)

This library dump `wp-dependencies.json` which includes dependencies and path information about js/css.

- You don't have to specify dependencies from php files.
- You can automate the registration & enqueue of assets.

## Example

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
            wp_register_script( $handle, $url, $deps, $version, $setting['footer'] );
        } else {
            // This is CSS.
            wp_register_style( $handle, $url, $deps, $version, $setting['media'] ); 
        }
    }
} );
```

Now you can enqueue any of your scripts/styles with `wp_enqueue_script( 'my-app-js' )` or `wp_enqueue_style( 'my-blocks-alert-css' )`.

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

And run this in your [npm scripts](https://docs.npmjs.com/misc/scripts) or [gulpfile.js](https://gulpjs.com/).

```js
// Import function.
const { dumpSetting } = require('@kunoichi/grab-deps');
// Dump JSON
dumpSetting( 'assets' );
```

For automatic dumping, watch assets directory.

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

Now you can get updated dump information whatever changes you made for assets.

### JSON Example

```json
[
  {
    "path": "assets/js/app.js",
    "deps": [ "jquery", "wp-api-fetch" ],
  }
]
```

### License text

Nowadays, some compilers like [webpack](https://webpack.js.org/plugins/terser-webpack-plugin/) extract license comments. If original is like below:

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
console.log( 'Start rendering!' );
```

And in same directory, `file.js.LICENSE.txt` will be exported.

```js
/*!
 * Main app file.js
 *
 * @version 2.0.0
 */
```

In such case, `@kunoichi/grab-deps` will support `.LISENCE.txt` format by default. 3rd arghment `suffix` of `dumpSetting` supports other format.

```js
// If your JS license will be in `app.js.txt`,
// You can set suffix.
// `app.js` will be `app.js.txt`
dumpSetting( 'assets', './wp-dependencies.json', '.txt' );
// If your licenses will be other format, specify function.
dumpSetting( 'assets', './wp-dependencies.json', function( path ) {
  // Convert path to your license.txt
  return licensePath;
} );
```
