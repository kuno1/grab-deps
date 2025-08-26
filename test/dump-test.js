const assert = require( 'assert' );
const { dumpSetting } = require( '../index' );
const fs = require( 'fs' );

describe( 'JSON Dump Test', () => {
	// Dump first.
	dumpSetting( 'test/src' );
	// Load setting.
	const setting = JSON.parse( fs.readFileSync( 'wp-dependencies.json', 'utf8' ) );
	it( 'Count Length', () => {
		assert.equal( setting.length,  24);
	} );
	it( 'Check Deep CSS', () => {
		let css = null;
		setting.map( ( c ) => {
			if ( /file\.css$/.test( c.path )  ) {
				css = c;
			}
		} );
		assert.deepEqual( css.deps, [ 'bootstrap' ] );
	} );
} );
