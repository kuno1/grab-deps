const fs = require( 'fs' );
const glob = require( 'glob' );

/**
 * Grab dependencies from file.
 *
 * @param {String} file   File path to scan.
 * @param {String|Function} suffix Suffix for license.txt. If exists, it priors. Default, ".License.txt".
 * @returns {Error}
 */
function grabDeps( file, suffix = '' ) {
	if ( '' === suffix ) {
		suffix = '.LICENSE.txt';
	}
	let fileToScan = file;
	let licenseTxt = '';
	switch ( typeof suffix) {
		case 'string':
			if ( suffix ) {
				licenseTxt = file + suffix;
			}
			break;
		case 'function':
			const generagedSuffix = suffix( file );
			if ( generagedSuffix ) {
				licenseTxt = generagedSuffix;
			}
			break;
	}
	if ( licenseTxt && fs.existsSync( licenseTxt ) ) {
		fileToScan = licenseTxt;
	}
	const fileContent = fs.readFileSync( fileToScan, 'utf8' );
	const deps = [];
	if ( fileContent ) {
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
	}
	return deps;
};
module.exports.grabDeps = grabDeps;

/**
 * Scan directory and extract dependencies.
 * @param {String} dir Directory file to scan.
 * @param {String} suffix Suffix for license file.
 * @returns {Array}
 */
function scanDir( dir, suffix = '' ) {
	const pattern = dir.replace( /\/$/, '' ) + '/**/*.*(css|js)';
	const matches = glob.sync( pattern );
	const result = [];
	matches.map( ( file ) => {
		result.push( {
			path: file,
			ext: /\.js$/.test( file ) ? 'js' : 'css',
			deps: grabDeps( file, suffix ),
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
 * @param {String} suffix Suffix for license file.
 * @param {String} dump File to dump.
 */
function dumpSetting( dir, dump = './wp-dependencies.json', suffix = '' ) {
	const result = scanDir( dir, suffix );
	fs.writeFileSync( dump, JSON.stringify( result, null, "\t" ) );
}
module.exports.dumpSetting = dumpSetting;
