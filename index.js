const fs = require( 'fs' );
const crypto = require( 'crypto' );
const { glob } = require( 'glob' );
const { execSync } = require( 'child_process' );
const path = require( 'path' );

// Import internal modules
const { readGrabDepsConfig } = require( './lib/config' );
const {
	scanHeader,
	parseExports,
	parseNamespaceImports,
} = require( './lib/parsers' );
const {
	generateHandleName,
	convertNamespaceImportToHandle,
	generateGlobalRegistration,
} = require( './lib/generators' );
const { extractHeaderToLicense } = require( './lib/file-utils' );
const { addPath, isWordPressScriptsAvailable } = require( './lib/build-utils' );

/**
 * Grab dependencies from file.
 *
 * @param {string}            file       File path to scan.
 * @param {string | Function} suffix     Suffix for license.txt. If exists, it priors. Default, ".License.txt".
 * @param {string}            version    Default version for files. If specified in header, it priors.
 * @param {string}            configPath Optional path to config file.
 * @return {object|null} Dependency object with handle, path, deps, etc. or null if file content is empty
 */
function grabDeps( file, suffix = '', version = '0.0.0', configPath = null ) {
	const config = readGrabDepsConfig( configPath );

	// Debug: Log configuration for troubleshooting
	if ( process.env.GRAB_DEPS_DEBUG ) {
		console.log( `[DEBUG] File: ${file}` );
		console.log( `[DEBUG] Config:`, config );
		console.log( `[DEBUG] ConfigPath: ${configPath}` );
	}

	const handleName = file
		.split( '/' )
		.slice( -1 )[ 0 ]
		.replace( /\.(js|jsx|css|scss)$/, '' );

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
				const match = assetsContent.match(
					/'dependencies' => array\(([^)]+)\)/
				);
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
			const licenseDepsMatch = fileContent.match(
				/^\s*\*\s*@deps\s+([^\n*]+)/gm
			);
			if ( licenseDepsMatch ) {
				licenseDepsMatch.forEach( ( match ) => {
					const depsLine = match
						.replace( /^\s*\*\s*@deps\s+/, '' )
						.trim();
					depsLine.split( ',' ).forEach( ( dep ) => {
						const trimmedDep = dep.trim();
						if ( trimmedDep && ! deps.includes( trimmedDep ) ) {
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
		const originalHandle = file
			.split( '/' )
			.slice( -1 )[ 0 ]
			.replace( /\.(js|jsx|css|scss)$/, '' );
		if (
			scanned.handle === originalHandle &&
			config.autoHandleGeneration &&
			config.namespace &&
			config.srcDir
		) {
			try {
				const srcDirPath = path.resolve( config.srcDir );
				const filePath = path.resolve( file );

				// Check if file is within the configured source directory
				if ( filePath.startsWith( srcDirPath ) ) {
					scanned.handle = generateHandleName(
						file,
						config.srcDir,
						config.namespace
					);
				}
			} catch ( e ) {
				// Fall back to default handle name
			}
		}

		// Parse namespace import statements and add to dependencies if enabled
		if ( config.autoImportDetection && config.namespace ) {
			try {
				const namespaceImports = parseNamespaceImports(
					fileContent,
					config.namespace
				);
				namespaceImports.forEach( ( importPath ) => {
					const importHandle = convertNamespaceImportToHandle(
						importPath,
						config.namespace
					);
					if (
						importHandle &&
						! scanned.deps.includes( importHandle )
					) {
						scanned.deps.push( importHandle );
					}
				} );
			} catch ( e ) {
				// Fall back to default behavior
			}
		}

		// Generate global registration code if enabled
		if (
			config.globalExportGeneration &&
			config.namespace &&
			config.srcDir &&
			scanned.ext === 'js'
		) {
			try {
				const srcDirPath = path.resolve( config.srcDir );
				const filePath = path.resolve( file );

				// Check if file is within the configured source directory
				if ( filePath.startsWith( srcDirPath ) ) {
					const exports = parseExports( fileContent );
					if ( exports.named.length > 0 || exports.default ) {
						const globalCode = generateGlobalRegistration(
							file,
							config.srcDir,
							config.namespace,
							exports
						);
						scanned.globalRegistration = globalCode;
					}
				}
			} catch ( e ) {
				// Fall back to default behavior
			}
		}

		return scanned;
	}
	return null;
}

/**
 * Scan directory and extract dependencies.
 *
 * @param {string|string[]}   dirs       Directory file to scan. CSV format is also supported.
 * @param {string | Function} suffix     Suffix for license file.
 * @param {string}            version    Default version string.
 * @param {string}            configPath Optional path to config file.
 * @return {Array} Array of dependency objects
 */
function scanDir( dirs, suffix = '', version = '0.0.0', configPath = null ) {
	if ( 'string' === typeof dirs ) {
		dirs = dirs.split( ',' );
	}
	const result = [];
	dirs.forEach( ( dir ) => {
		const pattern = dir.replace( /\/$/, '' ) + '/**/*.*(css|js)';
		const matches = glob.sync( pattern );
		matches.forEach( ( file ) => {
			result.push( grabDeps( file, suffix, version, configPath ) );
		} );
	} );
	return result;
}

/**
 * Dump dependencies in json file.
 *
 * @param {string|string[]}   dirs       Directory to scan.
 * @param {string}            dump       File to dump.
 * @param {string | Function} suffix     Suffix for license file.
 * @param {string}            version    Default version string.
 * @param {string}            configPath Optional path to config file.
 * @return {void} Writes dependency information to JSON file
 */
function dumpSetting(
	dirs,
	dump = './wp-dependencies.json',
	suffix = '',
	version = '0.0.0',
	configPath = null
) {
	const result = scanDir( dirs, suffix, version, configPath );
	fs.writeFileSync( dump, JSON.stringify( result, null, '\t' ) );
}

/**
 * Compile JS in directory.
 *
 * wp-scripts does not support nested js directory.
 * This function compiles all js files in the directory and keep the directory structure.
 *
 * 1. Pre-process ES6 export files to CommonJS format in temporary directory.
 * 2. Compile all ES6+ or JSX files in the directory.
 * 3. Remove block directory.
 * 4. Extract license header to license.txt.
 *
 * @param {string}   srcDir     Source directory.
 * @param {string}   destDir    Target directory.
 * @param {string[]} extensions Extensions to compile.
 * @param {string}   configPath Optional path to config file.
 * @return {Promise} Promise that resolves with compilation results
 */
function compileDirectory(
	srcDir,
	destDir,
	extensions = [ 'js', 'jsx' ],
	configPath = null
) {
	// Remove trailing slashes.
	srcDir = srcDir.replace( /\/+$/, '' );
	destDir = destDir.replace( /\/+$/, '' );
	if ( ! isWordPressScriptsAvailable() ) {
		return Promise.reject(
			new Error( 'This function requires @wordpress/scripts.' )
		);
	}
	const globDir = extensions.map( ( ext ) => `${ srcDir }/**/*.${ ext }` );
	const tempDir = '.grab-deps-temp';

	return glob( globDir )
		.then( ( res ) => {
			// Pre-process ES6 export files if needed
			const config = readGrabDepsConfig( configPath );

			// Create temporary directory for pre-processing
			if ( fs.existsSync( tempDir ) ) {
				execSync( `rm -rf ${ tempDir }` );
			}
			fs.mkdirSync( tempDir, { recursive: true } );

			// Process files and create temporary versions if needed
			res.forEach( ( filePath ) => {
				if (
					config.globalExportGeneration &&
					config.namespace &&
					config.srcDir
				) {
					const fileContent = fs.readFileSync( filePath, 'utf8' );
					const exports = parseExports( fileContent );

					// If file has exports, create CommonJS version in temp directory
					if ( exports.named.length > 0 || exports.default ) {
						const tempFilePath = path.join(
							tempDir,
							path.basename( filePath )
						);
						const convertedContent = convertES6ToCommonJS(
							fileContent,
							filePath,
							srcDir,
							config.namespace,
							exports
						);
						fs.writeFileSync( tempFilePath, convertedContent );
						// Replace original file temporarily
						fs.writeFileSync( filePath + '.backup', fileContent );
						fs.writeFileSync( filePath, convertedContent );
					}
				}
			} );

			/** @type {import('./lib/build-utils').Path[]} pathsArray */
			const pathsArray = [];
			res.forEach( ( filePath ) => {
				addPath( pathsArray, filePath );
			} );

			// Run build on processed files
			const errors = [];
			pathsArray.forEach( ( p ) => {
				try {
					execSync(
						`npx wp-scripts build ${ p.path.join(
							' '
						) } --output-path=${ p.dir.replace( srcDir, destDir ) }`
					);
				} catch ( e ) {
					if ( e.stdout ) {
						// eslint-disable-next-line no-console
						console.log( e.stdout.toString() );
					}
					if ( e.stderr ) {
						// eslint-disable-next-line no-console
						console.log( e.stderr.toString() );
					}
					errors.push( p.path.join( ', ' ) );
				}
			} );

			// Restore original files
			res.forEach( ( filePath ) => {
				if ( fs.existsSync( filePath + '.backup' ) ) {
					fs.writeFileSync(
						filePath,
						fs.readFileSync( filePath + '.backup', 'utf8' )
					);
					fs.unlinkSync( filePath + '.backup' );
				}
			} );

			// Clean up temp directory
			if ( fs.existsSync( tempDir ) ) {
				execSync( `rm -rf ${ tempDir }` );
			}

			if ( errors.length ) {
				throw new Error( `Failed to build: ${ errors.join( ', ' ) }` );
			}
			return pathsArray;
		} )
		.then( ( pathsArray ) => {
			// 削除前にasset.phpファイルを解析して依存関係情報を取得
			return glob( [ `${ destDir }/**/*.asset.php` ] ).then(
				( assetFiles ) => {
					const dependencyMap = {};
					assetFiles.forEach( ( assetFile ) => {
						const jsFile = assetFile.replace( '.asset.php', '.js' );
						const assetContent = fs.readFileSync(
							assetFile,
							'utf8'
						);
						if ( assetContent ) {
							const match = assetContent.match(
								/'dependencies' => array\(([^)]+)\)/
							);
							if ( match ) {
								const deps = [];
								match[ 1 ].split( ',' ).forEach( ( dep ) => {
									deps.push(
										dep.trim().replaceAll( "'", '' )
									);
								} );
								dependencyMap[ jsFile ] = deps;
							}
						}
					} );

					// Remove all block json and asset.php files
					return glob( [
						`${ destDir }/**/blocks`,
						`${ destDir }/**/*.asset.php`,
					] ).then( ( res ) => {
						if ( res.length > 0 ) {
							execSync( `rm -rf ${ res.join( ' ' ) }` );
						}
						return { pathsArray, dependencyMap };
					} );
				}
			);
		} )
		.then( ( { pathsArray, dependencyMap } ) => {
			// No post-processing needed, global registration is included in pre-processing
			return { pathsArray, dependencyMap };
		} )
		.then( ( { dependencyMap } ) => {
			// license.txtを生成する際に依存関係情報を含める
			return glob( globDir ).then( ( res ) => {
				const result = { total: res.length, extracted: 0 };
				res.forEach( ( filePath ) => {
					result.total++;
					const destFile = filePath.replace( srcDir, destDir );
					const deps = dependencyMap[ destFile ] || [];
					if (
						extractHeaderToLicense(
							filePath,
							srcDir,
							destDir,
							deps
						)
					) {
						result.extracted++;
					}
				} );
				return result;
			} );
		} );
}

/**
 * Convert ES6 exports to CommonJS format with global registration.
 *
 * @param {string} content   Source file content.
 * @param {string} filePath  File path for global registration.
 * @param {string} srcDir    Source directory.
 * @param {string} namespace Global namespace.
 * @param {Object} exports   Export information.
 * @return {string} Converted content.
 */
function convertES6ToCommonJS( content, filePath, srcDir, namespace, exports ) {
	// Remove export statements and convert to const declarations
	let convertedContent = content;

	// Convert named exports
	exports.named.forEach( ( exportName ) => {
		const exportRegex = new RegExp(
			`export\\s+const\\s+${ exportName }\\s*=`,
			'g'
		);
		convertedContent = convertedContent.replace(
			exportRegex,
			`const ${ exportName } =`
		);
	} );

	// Convert default export
	if ( exports.default ) {
		convertedContent = convertedContent.replace(
			/export\s+default\s+/,
			'const defaultExport = '
		);
	}

	// Generate global registration code
	const globalCode = generateGlobalRegistration(
		filePath,
		srcDir,
		namespace,
		exports
	);

	// Append global registration
	convertedContent += '\n\n' + globalCode;

	return convertedContent;
}

// Export only the main public API functions
module.exports = {
	grabDeps,
	scanDir,
	dumpSetting,
	compileDirectory,
};
