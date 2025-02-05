const assert = require( 'assert' );
const { grabDeps } = require( '../index' );

describe( 'Additional meta information', () => {
	const js        = grabDeps( 'test/src/js/plugin-jquery.js' );
	const js_no     = grabDeps( 'test/src/js/no-deps.js' );
	const css       = grabDeps( 'test/src/css/bootstrap.css' );
	const css_no    = grabDeps( 'test/src/css/no-deps.css' );
	const css_media = grabDeps( 'test/src/css/css-media.css' );

	it( 'JS with @version', () => {
		assert.equal( js.version, '2.0.0' );
	} );

	it( 'JS without @version', () => {
		assert.equal( js_no.version, '0.0.0' );
	} );

	it( 'CSS with @version', () => {
		assert.equal( css.version, '1.5.9' );
	} );

	it( 'CSS without @version', () => {
		assert.equal( css_no.version, '0.0.0' );
	} );

	it( 'JS with @handle', () => {
		assert.equal( js.handle, 'my-plugin-jquery' );
	} );

	it( 'JS without @handle', () => {
		assert.equal( js_no.handle, 'no-deps' );
	} );

	it( 'CSS with @handle', () => {
		assert.equal( css.handle, 'my-plugin-bootstrap' );
	} );

	it( 'CSS without @handle', () => {
		assert.equal( css_no.handle, 'no-deps' );
	} );

	it( 'JS with @footer', () => {
		assert.equal( js.footer, false );
	} );

	it( 'JS without @footer', () => {
		assert.equal( js_no.footer, true );
	} );

	it( 'CSS with @media', () => {
		assert.equal( css.media, 'print' );
	} );

	it( 'CSS with @media', () => {
		assert.equal( css_no.media, 'all' );
	} );

	it( 'JS with @strategy', () => {
		assert.equal( js.strategy, 'defer' );
	} );

	it( 'CSS with media query', () => {
		assert.equal( css_media.media, 'print' );
	} );
} );

describe( 'File Hash', () => {

	it( 'md5 of JS', () => {
		assert.match( grabDeps( 'test/src/js/plugin-jquery.js' ).hash, /^[0-9a-f]{32}$/ );
	} );

	it( 'md5 of JS with LICENSE.txt', () => {
		// no-comment.js 86b216f72671443a7ddab5ea2ecbfefa
		// no-comment.js.LICENSE.txt 5e84fd5b5817a6397aeef4240afeb97a
		assert.equal( grabDeps( 'test/src/js/no-comment.js' ).hash, '86b216f72671443a7ddab5ea2ecbfefa' );
	} );

	it( 'md5 of CSS', () => {
		assert.match( grabDeps( 'test/src/css/bootstrap.css' ).hash, /^[0-9a-f]{32}$/ );
	} );
} );
