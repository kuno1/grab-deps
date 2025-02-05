const fs = require( 'fs' );
const crypto = require( 'crypto' );
const { glob } = require( 'glob' )
const { execSync, spawnSync } = require("child_process");

/**
 * @typedef Path
 * @type {object}
 * @property {string} dir    - Parent directory.
 * @property {number} order  - Order. Lower processed first.
 * @property {string[]} path - Array of file path.
 */

/**
 * Add path by order.
 *
 * @param {Path[]} paths
 * @param {string}   newPath
 * @return {void}
 */
const addPath = ( paths, newPath ) => {
	const pathParts = newPath.split( '/' ).filter( path => path.length >= 1 );
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
			dir: parentDir, order: length, path: [ [ parentDir, lastName ].join( '/' ) ],
		} );
	}
	paths.sort( ( a, b ) => {
		if ( a.order === b.order ) {
			return 0;
		} else {
			return a.order < b.order ? -1 : 1;
		}
	} );
}

/**
 * Extract license header from JS file.
 *
 * @param {string} path
 * @param {string} src
 * @param {string} dest
 * @return {boolean}
 */
const extractHeaderToLicense = ( path, src, dest ) => {
	const target = path.replace( src, dest ) + '.LICENSE.txt';
	const content = fs.readFileSync( path, 'utf8' );
	if ( !content ) {
		return false;
	}
	const match = content.match( /^(\/\*{1,2}!.*?\*\/)/ms );
	if ( !match ) {
		return false;
	}
	fs.writeFileSync( target, match[ 1 ] );
	return true;
}

/**
 * Check if wp-scripts is available.
 *
 * @returns {boolean}
 */
function isWordPressScriptsAvailable() {
	const result = spawnSync("npm", ["list", "@wordpress/scripts"], { encoding: "utf-8" });
	return result.stdout.match( /@wordpress\/scripts/ms );
}

/**
 * Parse header to grab information.
 *
 * @param {object}   object      Object to assign.
 * @param {string}   fileContent Line string to parse.
 * @param {string[]} deps        Additional dependencies.
 * @return {object}
 */
function scanHeader( object, fileContent, deps ) {
	if ( !deps ) {
		deps = [];
	}
	lines = fileContent.toString().split( "\n" );
	lines.map( ( line, index ) => {
		if ( !line.match( /^[ *]*(wp|@)(deps|handle|version|footer|media|strategy|cssmedia)=?(.*)$/ ) ) {
			// This is not header. Skip.
			return;
		}

		const key = RegExp.$2.trim();
		let value = RegExp.$3.trim();
		switch ( key ) {
			case 'version':
			case 'handle':
			case 'strategy':
				object[ key ] = value;
				break;
			case 'media':
				if ( ! object.media ) {
					object.media = value;
				}
				break;
			case 'cssmedia':
				object.media = value;
				break;
			case 'footer':
				object.footer = !( 'false' === value );
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
		handle: file.split( '/' ).slice( -1 )[ 0 ].replace( /\.(js|jsx|css|scss)$/, '' ),
		path: file,
		ext: /\.js$/.test( file ) ? 'js' : 'css',
		hash: '',
		version,
		deps: [],
		footer: true,
		media: '',
		strategy: '',
	};
	if ( '' === suffix ) {
		suffix = '.LICENSE.txt';
	}
	let fileToScan = file;
	let licenseTxt = '';
	switch ( typeof suffix ) {
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
		fileToScan = licenseTxt;
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
					match[ 1 ].split( ',' ).forEach( ( dep ) => {
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
		const scanned = scanHeader( info, fileContent, deps );
		if ( ! scanned.media ) {
			scanned.media = 'all';
		}
		return scanned;
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

/**
 * Compile JS in directory.
 *
 * wp-scripts does not support nested js directory.
 * This function compiles all js files in the directory and keep the directory structure.
 *
 * 1. Compile all ES6+ or JSX files in the directory.
 * 2. Remove block directory.
 * 3. Extract license header to license.txt.
 *
 * @param {string} srcDir Source directory.
 * @param {string} destDir Target directory.
 * @param {string[]} extensions Extensions to compile.
 * @returns {Promise}
 */
function compileDirectory( srcDir, destDir, extensions = [ 'js', 'jsx' ] ) {
	// Remove trailing slashes.
	srcDir =  srcDir.replace( /\/+$/, '' );
	destDir =  destDir.replace( /\/+$/, '' );
	const globDir = extensions.map( ext => `${srcDir}/**/*.${ext}` );
	if ( ! isWordPressScriptsAvailable() ) {
		return Promise.reject( new Error( 'This function requires @wordpress/scripts.' ) );
	}
	return glob( globDir ).then( res => {
		/** @type {Path[]} paths */
		const paths = [];
		res.forEach( ( path ) => {
			addPath( paths, path );
		} );
		// Run build
		const errors = [];
		paths.forEach( ( p ) => {
			try {
				execSync( `wp-scripts build ${ p.path.join( ' ' ) } --output-path=${ p.dir.replace( srcDir, destDir ) }` );
			} catch ( e ) {
				console.log( e );
				errors.push( p.path.join( ', ' ) );
			}
		} );
		if ( errors.length ) {
			throw new Error( `Failed to build: ${ errors.join( ', ' ) }` );
		}
		return paths;
	} ).then( ( paths ) => {
		// Remove all block json.
		return glob( [ `${destDir}/**/blocks`, `${destDir}/**/*.asset.php` ] ).then( res => {
			execSync( `rm -rf ${ res.join( ' ' ) }` );
			return res.length;
		} );
	} ).then( () => {
		// Put license.txt.
		return glob( globDir ).then( res => {
			const result = { total: res.length, extracted: 0};
			res.map( ( path ) => {
				result.total++;
				if ( extractHeaderToLicense( path, srcDir, destDir ) ) {
					result.extracted++;
				}
			} );
			return result;
		} );
	} );
}

module.exports.scanHeader = scanHeader;
module.exports.grabDeps = grabDeps;
module.exports.scanDir = scanDir;
module.exports.dumpSetting = dumpSetting;
module.exports.compileDirectory = compileDirectory;
