const fs = require( 'fs' );
const glob = require( 'glob' );

/**
 * Grab dependencies from file.
 *
 * @param {String} file File path to scan.
 * @returns {Error}
 */
function grabDeps( file ) {
	const fileContent = fs.readFileSync( file, 'utf8' );
	if ( fileContent ) {
		const deps = [];
		fileContent.toString().split( "\n" ).map( ( line, index ) => {
			if ( line.match( /^[ *]*(wp|@)deps=?(.*)$/ ) ) {
				RegExp.$2.split( ',' ).map( ( dep ) => {
					dep = dep.trim();
					if ( 0 > deps.indexOf( dep ) ) {
						deps.push( dep );
					}
				} );
			}
		} );
		return deps;
	} else {
		return new Error( 'File not found.' );
	}
};
module.exports.grabDeps = grabDeps;

/**
 * Scan directory and extract dependencies.
 * @param {String} dir Directory file to scan.
 * @returns {Array}
 */
function scanDir( dir ) {
	const pattern = dir.replace( /\/$/, '' ) + '/**/*.*(css|js)';
	const matches = glob.sync( pattern );
	const result = [];
	matches.map( ( file ) => {
		result.push( {
			path: file,
			ext: /\.js$/.test( file ) ? 'js' : 'css',
			deps: grabDeps( file ),
			footer: true,
		} );
	} );
	return result;
};
module.exports.scanDir = scanDir;

/**
 * Dump dependencies in json file.
 *
 * @param {String} dir  Directory to scan.
 * @param {String} dump File to dump.
 */
function dumpSetting( dir, dump = './wp-dependencies.json' ) {
	const result = scanDir( dir );
	fs.writeFileSync( dump, JSON.stringify( result, null, "\t" ) );
}
module.exports.dumpSetting = dumpSetting;
