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
		assert.deepEqual( grabDeps( 'test/src/js/no-comment.js' ).deps, [ 'jquery', 'jquery-ui-datepicker', 'wp-element', 'wp-i18n' ] );
	} );
	it( 'mit.txt', () => {
		assert.deepEqual( grabDeps( 'test/src/js/no-comment.js', '.mit.txt' ).deps, [ 'jquery', 'jquery-ui-datepicker', 'wp-element', 'wp-blocks' ] );
	} );
	it( 'function.txt', () => {
		assert.deepEqual( grabDeps( 'test/src/js/no-comment.js', ( file ) => {
			return file.replace( '.js', '-license.txt' );
		} ).deps, [ 'jquery', 'jquery-ui-datepicker', 'wp-element', 'scriptaculous' ] );
	} );
} );

describe( 'WordPress imports test.', () => {
	it( 'WordPress imports from compiled file', () => {
		const result = grabDeps( 'test/dist/js/wp/deps-wp-i18n.js' );
		assert.deepEqual( result.deps, [ 'wp-api-fetch', 'wp-element', 'wp-i18n' ] );
		assert.equal( result.handle, 'test-wp-imports' );
	} );
	it( 'Mixed @deps and imports - should have single @deps section', () => {
		const result = grabDeps( 'test/dist/js/wp/mixed-deps.js' );
		assert.deepEqual( result.deps, [ 'jquery', 'wp-blocks', 'wp-element', 'wp-i18n' ] );
		assert.equal( result.handle, 'test-mixed-deps' );
	} );
	it( 'Duplicate dependencies - should remove duplicates', () => {
		const result = grabDeps( 'test/dist/js/wp/duplicate-deps.js' );
		assert.deepEqual( result.deps, [ 'wp-i18n', 'jquery', 'wp-element' ] );
		assert.equal( result.handle, 'test-duplicate-deps' );
	} );
} );
