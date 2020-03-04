# grab-deps

WordPress library to extract dependencies information from js/css 
files.

![TEST](https://github.com/kuno1/grab-deps/workflows/Grab%20deps%20test./badge.svg?branch=master)

This library dump `wp-dependencies.json` which includes dependencies and path information about js/css.

- You don't have to specify dependencies from php files.
- You can automate the registration & enqueue of assets.

## Example

Suppose that you have `assets/js/app.js` in your theme folder.

```js
/*!
 * @deps jquery, jquery-masonry, wp-i18n
 */
console.log( 'This script runs jQuery Masonry.' );
```

And you can get setting file `wp-dependencies.json` like this.

```json
[
  {
    "path": "assets/js/app.js",
    "deps": [ "jquery", "jquery-masonry", "wp-i18n" ],
    "ext": "js",
    "footer": true
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
        $path   = get_template_directory() . '/' . $setting['path'];
        $url    = get_template_directory_uri() . '/' . $setting['path'];
        $time   = filemtim( $path );
        $handle = 'my-' . str_replace( '.', '-', basename( $path ) );
        if ( 'js' === $setting['ext'] ) {
            // Register JavaScript.
            wp_register_script( $handle, $url, $deps, $time, true );
        } else {
            // This is CSS.
            wp_register_style( $handle, $url, $deps, $time ); 
        }
    }
} );
```

Now you can enqueue any of your scripts/styles with `wp_enqueue_script( 'my-app-js' )` or `wp_enqueue_style( 'my-blocks-alert-css' )`.

## Installation

```bash
npm install @kunoichi/grab-deps
```

## Usage

Suppose that the directory structure of your theme/plugin is like below:

```
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