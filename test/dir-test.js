const assert = require( 'assert' );
const { scanDir } = require( '../index' );

describe( 'Directory Scanner Test', () => {
	const dir = scanDir( 'test/src' );
	it( 'Count Length', () => {
		assert.equal( dir.length, 8 );
	} );
	it( 'Check Deep CSS', () => {
		let css = null;
		dir.map( ( c ) => {
			if ( /file\.css$/.test( c.path )  ) {
				css = c;
			}
		} );
		assert.deepEqual( css.deps, [ 'bootstrap' ] );
	} );
	it( 'Directory as array of string', () => {
		const results = scanDir( [ 'test/src/css', 'test/src/js' ] );
		assert.equal( 8, results.length );
	} );
} );
