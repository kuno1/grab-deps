const fs = require( 'fs' );
const crypto = require( 'crypto' );
const glob = require( 'glob' );

/**
 * Parse header to grab information.
 *
 * @param {object}   object      Object to assign.
 * @param {string}   fileContent Line string to parse.
 * @param {string[]} deps        Additional dependencies.
 * @return {object}
 */
function scanHeader( object, fileContent, deps ) {
	if ( ! deps ) {
		deps = [];
	}
	fileContent.toString().split( "\n" ).map( ( line, index ) => {
		if ( ! line.match( /^[ *]*(wp|@)(deps|handle|version|footer|media)=?(.*)$/ ) ) {
			// This is not header. Skip.
			return;
		}

		const key = RegExp.$2.trim();
		let value = RegExp.$3.trim();
		switch ( key ) {
			case 'version':
			case 'media':
			case 'handle':
				object[ key ] = value;
				break;
			case 'footer':
				object.footer = ! ( 'false' === value );
				break;
			case 'deps':
				value.split( ',' ).map( ( dep ) => {
					dep = dep.trim();
					if ( 0 > deps.indexOf( dep ) ) {
						deps.push( dep );
					}
				} );
				break;
		}
	} );
	object.deps = deps;
	return object;
}

/**
 * Grab dependencies from file.
 *
 * @param {String}          file    File path to scan.
 * @param {String|Function} suffix  Suffix for license.txt. If exists, it priors. Default, ".License.txt".
 * @param {String}          version Default version for files. If specified in header, it priors.
 * @returns {object|null}
 */
function grabDeps( file, suffix = '', version = '0.0.0' ) {
	const info = {
		handle: file.split( '/' ).slice( -1 )[0].replace( /\.(js|jsx|css|scss)$/, '' ),
		path: file,
		ext: /\.js$/.test( file ) ? 'js' : 'css',
		hash: '',
		version,
		deps: [],
		footer: true,
		media: 'all'
	};
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
			const generatedSuffix = suffix( file );
			if ( generatedSuffix ) {
				licenseTxt = generatedSuffix;
			}
			break;
	}
	// Create hash.
	let hashOriginal = false;
	if ( licenseTxt && fs.existsSync( licenseTxt ) ) {
		fileToScan   = licenseTxt;
		hashOriginal = true;
	}

	// Search $file.assets.php file.
	const deps = [];
	if ( file.match( /\.js$/ ) ) {
		const assetsFile = file.replace( /\.js$/, '.asset.php' );
		if ( fs.existsSync( assetsFile ) ) {
			// Scan PHP and get dependencies.
			const assetsContent = fs.readFileSync( assetsFile, 'utf8' );
			if ( assetsContent ) {
				const match = assetsContent.match( /'dependencies' => array\(([^)]+)\)/ );
				if ( match ) {
					match[1].split( ',' ).forEach( ( dep ) => {
						deps.push( dep.trim().replaceAll( "'", '' ) );
					} );
				}
			}
		}
	}

	const fileContent = fs.readFileSync( fileToScan, 'utf8' );
	if ( fileContent ) {
		// Add md5 hash string.
		const md5hash = crypto.createHash( 'md5' );
		if ( hashOriginal ) {
			md5hash.update( fs.readFileSync( file ) );
		} else {
			md5hash.update( fileContent );
		}
		info.hash = md5hash.digest( 'hex' );
		return scanHeader( info, fileContent, deps );
	} else {
		return null;
	}
}


/**
 * Scan directory and extract dependencies.
 *
 * @param {string|string[]} dirs    Directory file to scan.
 * @param {String|Function} suffix  Suffix for license file.
 * @param {String}          version Default version string.
 * @returns {Array}
 */
function scanDir( dirs, suffix = '', version = '0.0.0' ) {
	if ( 'string' === typeof dirs ) {
		dirs = [ dirs ];
	}
	const result = [];
	dirs.forEach( ( dir ) => {
		const pattern = dir.replace( /\/$/, '' ) + '/**/*.*(css|js)';
		const matches = glob.sync( pattern );
		matches.forEach( ( file ) => {
			result.push( grabDeps( file, suffix, version ) );
		} );
	} );
	return result;
}


/**
 * Dump dependencies in json file.
 *
 * @param {string|string[]} dirs    Directory to scan.
 * @param {String}          dump    File to dump.
 * @param {String|Function} suffix  Suffix for license file.
 * @param {String}          version Default version string.
 */
function dumpSetting( dirs, dump = './wp-dependencies.json', suffix = '', version = '0.0.0' ) {
	const result = scanDir( dirs, suffix, version );
	fs.writeFileSync( dump, JSON.stringify( result, null, "\t" ) );
}

module.exports.scanHeader = scanHeader;
module.exports.grabDeps = grabDeps;
module.exports.scanDir = scanDir;
module.exports.dumpSetting = dumpSetting;
