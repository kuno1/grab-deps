const fs = require( 'fs' );
const crypto = require( 'crypto' );
const { glob } = require( 'glob' )
const { execSync, spawnSync } = require("child_process");
const path = require( 'path' );

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
 * @param {string[]} deps - Dependencies from asset.php
 * @return {boolean}
 */
const extractHeaderToLicense = ( path, src, dest, deps = [] ) => {
	const target = path.replace( src, dest ) + '.LICENSE.txt';
	const content = fs.readFileSync( path, 'utf8' );
	if ( !content ) {
		return false;
	}

	let licenseContent = '';

	// 既存のライセンスヘッダーを取得
	const match = content.match( /^(\/\*{1,2}!.*?\*\/)/ms );
	if ( match ) {
		licenseContent = match[ 1 ];
	}

	// 依存関係情報を統合
	if ( deps.length > 0 ) {
		// 既存のライセンスヘッダーから既存の依存関係を取得
		const existingDeps = [];
		if ( licenseContent ) {
			const existingDepsMatch = licenseContent.match( /^\s*\*\s*@deps\s+([^\n*]+)/gm );
			if ( existingDepsMatch ) {
				existingDepsMatch.forEach( match => {
					const depsLine = match.replace( /^\s*\*\s*@deps\s+/, '' ).trim();
					depsLine.split( ',' ).forEach( dep => {
						const trimmedDep = dep.trim();
						if ( trimmedDep && !existingDeps.includes( trimmedDep ) ) {
							existingDeps.push( trimmedDep );
						}
					} );
				} );
			}
		}

		// 新しい依存関係を追加（重複を除去）
		const allDeps = [ ...existingDeps ];
		deps.forEach( dep => {
			if ( !allDeps.includes( dep ) ) {
				allDeps.push( dep );
			}
		} );

		if ( allDeps.length > 0 ) {
			if ( licenseContent ) {
				// 既存のライセンスヘッダーから @deps 行を削除
				licenseContent = licenseContent.replace( /^\s*\*\s*@deps\s+[^*\n]+\n?/gm, '' );
				// 統合された依存関係情報を追加
				const depsComment = `\n/*!\n * @deps ${ allDeps.join( ', ' ) }\n */`;
				licenseContent += depsComment;
			} else {
				// ライセンスヘッダーがない場合、依存関係情報のみを追加
				licenseContent = `/*!\n * @deps ${ allDeps.join( ', ' ) }\n */`;
			}
		}
	}

	if ( licenseContent ) {
		fs.writeFileSync( target, licenseContent );
		return true;
	}

	return false;
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
 * Read grab-deps configuration from package.json.
 *
 * @returns {object}
 */
function readGrabDepsConfig() {
	const packageJsonPath = path.join( process.cwd(), 'package.json' );
	if ( ! fs.existsSync( packageJsonPath ) ) {
		return {};
	}

	const packageJson = JSON.parse( fs.readFileSync( packageJsonPath, 'utf8' ) );
	const config = packageJson.grabDeps || {};

	// Set default values
	return {
		namespace: config.namespace || '', // No default namespace - must be explicitly set
		srcDir: config.srcDir || 'src',
		...config
	};
}

/**
 * Generate handle name based on folder structure.
 *
 * @param {string} filePath - File path relative to srcDir
 * @param {string} srcDir - Source directory
 * @param {string} namespace - Namespace prefix
 * @returns {string}
 */
function generateHandleName( filePath, srcDir, namespace ) {
	// Remove srcDir from path and file extension
	const relativePath = path.relative( srcDir, filePath );
	const pathWithoutExt = relativePath.replace( /\.(js|jsx|css|scss)$/, '' );

	// Convert path separators to dashes
	const pathParts = pathWithoutExt.split( path.sep );
	const handleName = `${namespace}-${pathParts.join( '-' )}`;

	return handleName;
}

/**
 * Generate temporary webpack config with grab-deps settings.
 *
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 * @returns {string} - Path to temporary webpack config
 */
function generateTempWebpackConfig( srcDir, destDir ) {
	const config = readGrabDepsConfig();
	const tempConfigPath = path.join( process.cwd(), '.grab-deps-webpack.config.js' );

	// Load base webpack config from @wordpress/scripts
	const baseConfigPath = require.resolve( '@wordpress/scripts/config/webpack.config.js' );

	const configContent = `
const baseConfig = require( '${baseConfigPath}' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

// Custom grab-deps configuration
const grabDepsConfig = ${JSON.stringify( config, null, 2 )};

// Check if user has custom webpack.config.js
let userConfig = {};
try {
	userConfig = require( '${path.join( process.cwd(), 'webpack.config.js' )}' );
} catch ( e ) {
	// No user config
}

// Merge configurations
const mergedConfig = {
	...baseConfig,
	...userConfig,
	plugins: [
		...(baseConfig.plugins || []).filter( p => !(p instanceof DependencyExtractionWebpackPlugin) ),
		...(userConfig.plugins || []).filter( p => !(p instanceof DependencyExtractionWebpackPlugin) ),
		new DependencyExtractionWebpackPlugin( {
			useDefaults: true,
			// Custom handle generation will be added here in future versions
		} )
	]
};

module.exports = mergedConfig;
`;

	fs.writeFileSync( tempConfigPath, configContent );
	return tempConfigPath;
}

/**
 * Clean up temporary webpack config file.
 *
 * @param {string} configPath - Path to temporary config file
 */
function cleanupTempConfig( configPath ) {
	if ( fs.existsSync( configPath ) ) {
		fs.unlinkSync( configPath );
	}
}

/**
 * Parse import statements from file content.
 *
 * @param {string} fileContent - File content to parse
 * @param {string} namespace - Namespace prefix to look for
 * @returns {string[]} - Array of namespace import paths
 */
function parseNamespaceImports( fileContent, namespace ) {
	const imports = [];
	const importRegex = /import\s+(?:(?:\{[^}]*\}|\w+|\*\s+as\s+\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+|\*\s+as\s+\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;

	let match;
	while ( ( match = importRegex.exec( fileContent ) ) !== null ) {
		const importPath = match[1];

		// Only process imports that start with namespace prefix (e.g., @mylib/)
		if ( importPath.startsWith( `@${namespace}/` ) ) {
			imports.push( importPath );
		}
	}

	return imports;
}

/**
 * Convert namespace import path to handle name.
 *
 * @param {string} importPath - Namespace import path (e.g., @mylib/utils/date)
 * @param {string} namespace - Namespace prefix
 * @returns {string} - Handle name
 */
function convertNamespaceImportToHandle( importPath, namespace ) {
	// Remove @namespace/ prefix and convert to handle format
	const pathWithoutNamespace = importPath.replace( `@${namespace}/`, '' );
	const handleName = `${namespace}-${pathWithoutNamespace.replace( /\//g, '-' )}`;

	return handleName;
}

/**
 * Parse export statements from file content.
 *
 * @param {string} fileContent - File content to parse
 * @returns {object} - Object containing exported items
 */
function parseExports( fileContent ) {
	const exports = {
		named: [], // Named exports: export const foo = ...
		default: null, // Default export: export default ...
		reexports: [] // Re-exports: export { foo } from './bar'
	};

	// Match named exports: export const/let/var/function/class
	const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
	let match;
	while ( ( match = namedExportRegex.exec( fileContent ) ) !== null ) {
		exports.named.push( match[1] );
	}

	// Match export statements: export { foo, bar }
	const exportStatementRegex = /export\s*\{\s*([^}]+)\s*\}/g;
	while ( ( match = exportStatementRegex.exec( fileContent ) ) !== null ) {
		const items = match[1].split( ',' ).map( item => item.trim().split( /\s+as\s+/ )[0] );
		exports.named.push( ...items );
	}

	// Match default export with variable name
	const defaultExportRegex = /export\s+default\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/;
	const defaultMatch = defaultExportRegex.exec( fileContent );
	if ( defaultMatch ) {
		exports.default = defaultMatch[1]; // variable name
	} else {
		// Check for other default export patterns (expressions, etc.)
		const defaultExportPattern = /export\s+default\s+/;
		if ( defaultExportPattern.test( fileContent ) ) {
			exports.default = true; // expression or other pattern
		}
	}

	// Remove duplicates
	exports.named = [ ...new Set( exports.named ) ];

	return exports;
}

/**
 * Generate global registration code for a module.
 *
 * @param {string} filePath - Path to the module file
 * @param {string} srcDir - Source directory
 * @param {string} namespace - Namespace prefix
 * @param {object} exports - Exported items from parseExports
 * @returns {string} - Global registration code
 */
function generateGlobalRegistration( filePath, srcDir, namespace, exports ) {
	// Generate namespace path: @namespace/utils/date -> window.namespace.utils.date
	const relativePath = path.relative( srcDir, filePath );
	const pathWithoutExt = relativePath.replace( /\.(js|jsx|ts|tsx)$/, '' );
	const namespaceParts = pathWithoutExt.split( path.sep );
	const globalPath = `window.${namespace}.${namespaceParts.join( '.' )}`;

	let code = `// Global registration for ${filePath}\n`;

	// Create namespace hierarchy
	const parts = [ namespace, ...namespaceParts ];
	for ( let i = 0; i < parts.length; i++ ) {
		const currentPath = `window.${parts.slice( 0, i + 1 ).join( '.' )}`;
		code += `${currentPath} = ${currentPath} || {};\n`;
	}

	// Register named exports
	if ( exports.named.length > 0 ) {
		code += `${globalPath} = Object.assign( ${globalPath}, {\n`;
		exports.named.forEach( ( exportName, index ) => {
			const comma = index < exports.named.length - 1 ? ',' : '';
			code += `\t${exportName}: ${exportName}${comma}\n`;
		} );
		code += `} );\n`;
	}

	// Register default export
	if ( exports.default ) {
		if ( typeof exports.default === 'string' ) {
			// export default variableName - assign the variable directly to the global path
			code += `${globalPath} = ${exports.default};\n`;
		} else {
			// export default expression - assign to .default property
			code += `${globalPath}.default = ${globalPath}.default || {};\n`;
		}
	}

	return code;
}

/**
 * Parse header to grab information.
 *
 * @param {object}   object      Object to assign.
 * @param {string}   fileContent Line string to parse.
 * @param {string[]} deps        Additional dependencies.
 * @param {number}   max_scan    Maximum lines to scan.
 * @return {object}
 */
function scanHeader( object, fileContent, deps, max_scan = 60 ) {
	if ( !deps ) {
		deps = [];
	}
	lines = fileContent.toString().split( "\n" );
	lines.forEach( ( line, i ) => {
		// If limit exceeded, stop scanning.
		if ( i + 1 > max_scan ) {
			return;
		}
		if ( ! line.match( /^[ *]*(wp|@)(deps|handle|version|footer|media|strategy|cssmedia)=?(.*)$/ ) ) {
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
	const config = readGrabDepsConfig();
	let handleName = file.split( '/' ).slice( -1 )[ 0 ].replace( /\.(js|jsx|css|scss)$/, '' );

	const info = {
		handle: handleName,
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

		// LICENSE.txtファイルから@deps情報を読み取る
		if ( hashOriginal && licenseTxt ) {
			const licenseDepsMatch = fileContent.match( /^\s*\*\s*@deps\s+([^\n*]+)/gm );
			if ( licenseDepsMatch ) {
				licenseDepsMatch.forEach( match => {
					const depsLine = match.replace( /^\s*\*\s*@deps\s+/, '' ).trim();
					depsLine.split( ',' ).forEach( dep => {
						const trimmedDep = dep.trim();
						if ( trimmedDep && !deps.includes( trimmedDep ) ) {
							deps.push( trimmedDep );
						}
					} );
				} );
			}
		}

		const scanned = scanHeader( info, fileContent, deps );
		if ( ! scanned.media ) {
			scanned.media = 'all';
		}

		// Apply folder-based handle name only if @handle is not explicitly set and autoHandleGeneration is enabled
		const originalHandle = file.split( '/' ).slice( -1 )[ 0 ].replace( /\.(js|jsx|css|scss)$/, '' );
		if ( scanned.handle === originalHandle && config.autoHandleGeneration && config.namespace && config.srcDir ) {
			try {
				const srcDirPath = path.resolve( config.srcDir );
				const filePath = path.resolve( file );

				// Check if file is within the configured source directory
				if ( filePath.startsWith( srcDirPath ) ) {
					scanned.handle = generateHandleName( file, config.srcDir, config.namespace );
				}
			} catch ( e ) {
				// Fall back to default handle name
			}
		}

		// Parse namespace import statements and add to dependencies if enabled
		if ( config.autoImportDetection && config.namespace ) {
			try {
				const namespaceImports = parseNamespaceImports( fileContent, config.namespace );
				namespaceImports.forEach( importPath => {
					const importHandle = convertNamespaceImportToHandle( importPath, config.namespace );
					if ( importHandle && !scanned.deps.includes( importHandle ) ) {
						scanned.deps.push( importHandle );
					}
				} );
			} catch ( e ) {
				// Fall back to default behavior
			}
		}

		// Generate global registration code if enabled
		if ( config.globalExportGeneration && config.namespace && config.srcDir && scanned.ext === 'js' ) {
			try {
				const srcDirPath = path.resolve( config.srcDir );
				const filePath = path.resolve( file );

				// Check if file is within the configured source directory
				if ( filePath.startsWith( srcDirPath ) ) {
					const exports = parseExports( fileContent );
					if ( exports.named.length > 0 || exports.default ) {
						const globalCode = generateGlobalRegistration( file, config.srcDir, config.namespace, exports );
						scanned.globalRegistration = globalCode;
					}
				}
			} catch ( e ) {
				// Fall back to default behavior
			}
		}

		return scanned;
	} else {
		return null;
	}
}

/**
 * Scan directory and extract dependencies.
 *
 * @param {string|string[]} dirs    Directory file to scan. CSV format is also supported.
 * @param {String|Function} suffix  Suffix for license file.
 * @param {String}          version Default version string.
 * @returns {Array}
 */
function scanDir( dirs, suffix = '', version = '0.0.0' ) {
	if ( 'string' === typeof dirs ) {
		dirs = dirs.split( ',' );
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
				if ( e.stdout) {
					console.log( e.stdout.toString() );
				}
				if ( e.stderr) {
					console.log( e.stderr.toString() );
				}
				errors.push( p.path.join( ', ' ) );
			}
		} );
		if ( errors.length ) {
			throw new Error( `Failed to build: ${ errors.join( ', ' ) }` );
		}
		return paths;
	} ).then( ( paths ) => {
		// 削除前にasset.phpファイルを解析して依存関係情報を取得
		return glob( [ `${destDir}/**/*.asset.php` ] ).then( assetFiles => {
			const dependencyMap = {};
			assetFiles.forEach( assetFile => {
				const jsFile = assetFile.replace( '.asset.php', '.js' );
				const assetContent = fs.readFileSync( assetFile, 'utf8' );
				if ( assetContent ) {
					const match = assetContent.match( /'dependencies' => array\(([^)]+)\)/ );
					if ( match ) {
						const deps = [];
						match[ 1 ].split( ',' ).forEach( ( dep ) => {
							deps.push( dep.trim().replaceAll( "'", '' ) );
						} );
						dependencyMap[jsFile] = deps;
					}
				}
			} );

			// Remove all block json and asset.php files
			return glob( [ `${destDir}/**/blocks`, `${destDir}/**/*.asset.php` ] ).then( res => {
				if ( res.length > 0 ) {
					execSync( `rm -rf ${ res.join( ' ' ) }` );
				}
				return { paths, dependencyMap };
			} );
		} );
	} ).then( ( { paths, dependencyMap } ) => {
		// license.txtを生成する際に依存関係情報を含める
		return glob( globDir ).then( res => {
			const result = { total: res.length, extracted: 0};
			res.forEach( ( path ) => {
				result.total++;
				const destFile = path.replace( srcDir, destDir );
				const deps = dependencyMap[destFile] || [];
				if ( extractHeaderToLicense( path, srcDir, destDir, deps ) ) {
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
module.exports.parseExports = parseExports;
module.exports.generateGlobalRegistration = generateGlobalRegistration;
