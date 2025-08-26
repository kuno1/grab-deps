const assert = require( 'assert' );
const { scanDir } = require( '../index' );

describe( 'Directory Scanner Test', () => {
	const dir = scanDir( 'test/src' );
	it( 'Count Length', () => {
		assert.equal( dir.length, 25, 'Count files in test/src' );
	} );
	it( 'Check Deep CSS', () => {
		let css = null;
		dir.map( ( c ) => {
			if ( /file\.css$/.test( c.path )  ) {
				css = c;
			}
		} );
		assert.deepEqual( css.deps, [ 'bootstrap' ], 'Scanned nested CSS' );
	} );
	it( 'Directory as array of string', () => {
		const results = scanDir( [ 'test/src/css', 'test/src/js' ] );
		assert.equal( results.length, 23, 'Total files are 23.' );
	} );
} );
