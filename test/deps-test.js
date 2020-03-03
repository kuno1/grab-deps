const assert = require( 'assert' );
const { grabDeps } = require( '../index' );

describe( 'Basic Grab Functions', () => {
	it( 'Single File', () => {
		assert.deepEqual( grabDeps( 'test/src/js/plugin-jquery.js' ), [ 'jquery', 'jquery-ui-effect' ] );
	} );
	it ( 'Empty deps', () => {
		assert.deepEqual( grabDeps( 'test/src/js/no-deps.js' ), [] );
	} );
	it( 'Multiple sections', () => {
		assert.deepEqual( grabDeps( 'test/src/js/multiple.js' ), [ 'jquery-masonry', 'wp-api-fetch', 'wp-api-request' ] );
	} );
} );
