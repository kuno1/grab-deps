const assert = require( 'assert' );
const { grabDeps } = require( '../index' );

describe( 'Basic Grab Functions', () => {
	it( 'Single File', () => {
		assert.deepEqual( grabDeps( 'test/src/js/plugin-jquery.js' ).deps, [ 'jquery', 'jquery-ui-effect' ] );
	} );
	it ( 'Empty deps', () => {
		assert.deepEqual( grabDeps( 'test/src/js/no-deps.js' ).deps, [] );
	} );
	it( 'Multiple sections', () => {
		assert.deepEqual( grabDeps( 'test/src/js/multiple.js' ).deps, [ 'jquery-masonry', 'wp-api-fetch', 'wp-api-request' ] );
	} );
} );

describe( 'License.txt test.', () => {
	it( 'LICENSE.txt', () => {
		assert.deepEqual( grabDeps( 'test/src/js/no-comment.js' ).deps, [ 'jquery', 'wp-element', 'wp-i18n' ] );
	} );
	it( 'mit.txt', () => {
		assert.deepEqual( grabDeps( 'test/src/js/no-comment.js', '.mit.txt' ).deps, [ 'jquery', 'wp-element', 'wp-blocks' ] );
	} );
	it( 'function.txt', () => {
		assert.deepEqual( grabDeps( 'test/src/js/no-comment.js', ( file ) => {
			return file.replace( '.js', '-license.txt' );
		} ).deps, [ 'jquery', 'wp-element', 'scriptaculous' ] );
	} );
} );
