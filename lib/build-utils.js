const { spawnSync } = require( 'child_process' );

/**
 * @typedef {Object} Path
 * @property {string}   dir   - Parent directory.
 * @property {number}   order - Order. Lower processed first.
 * @property {string[]} path  - Array of file path.
 */

/**
 * Add path by order.
 *
 * @param {Path[]} paths
 * @param {string} newPath
 * @return {void}
 */
function addPath( paths, newPath ) {
	const pathParts = newPath.split( '/' ).filter( ( p ) => p.length >= 1 );
	const length = pathParts.length;
	const lastName = pathParts.pop();
	const parentDir = pathParts.join( '/' );
	let index = -1;
	for ( let i = 0; i < paths.length; i++ ) {
		if ( paths[ i ].dir === parentDir ) {
			index = i;
			break;
		}
	}
	if ( 0 <= index ) {
		// Already exists.
		paths[ index ].path.push( [ parentDir, lastName ].join( '/' ) );
	} else {
		// Add new path.
		paths.push( {
			dir: parentDir,
			order: length,
			path: [ [ parentDir, lastName ].join( '/' ) ],
		} );
	}
	paths.sort( ( a, b ) => {
		if ( a.order === b.order ) {
			return 0;
		}
		return a.order < b.order ? -1 : 1;
	} );
}

/**
 * Check if wp-scripts is available.
 *
 * @return {boolean} True if wp-scripts is available.
 */
function isWordPressScriptsAvailable() {
	const result = spawnSync( 'npm', [ 'list', '@wordpress/scripts' ], {
		encoding: 'utf-8',
	} );
	return result.stdout.match( /@wordpress\/scripts/ms );
}

module.exports = {
	addPath,
	isWordPressScriptsAvailable,
};
