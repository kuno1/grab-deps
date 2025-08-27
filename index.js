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
		// eslint-disable-next-line no-console
		console.log( `[DEBUG] File: ${ file }` );
		// eslint-disable-next-line no-console
		console.log( `[DEBUG] Config:`, config );
		// eslint-disable-next-line no-console
		console.log( `[DEBUG] ConfigPath: ${ configPath }` );
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
 * Now uses webpack loader for namespace transformation instead of file manipulation.
 * This prevents file watcher infinite loops by processing files in memory only.
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
	// eslint-disable-next-line no-unused-vars
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

	return glob( globDir )
		.then( ( res ) => {
			/** @type {import('./lib/build-utils').Path[]} pathsArray */
			const pathsArray = [];
			res.forEach( ( filePath ) => {
				addPath( pathsArray, filePath );
			} );

			// Run build using our custom webpack config (includes namespace transformation)
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

			if ( errors.length ) {
				throw new Error( `Failed to build: ${ errors.join( ', ' ) }` );
			}
			return pathsArray;
		} )
		.then( ( pathsArray ) => {
			// Extract dependency information from asset.php files before cleanup
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
		.then( ( { dependencyMap } ) => {
			// Extract license headers and inject global registration code
			return glob( globDir ).then( ( res ) => {
				const config = readGrabDepsConfig( configPath );
				const result = { total: res.length, extracted: 0 };
				res.forEach( ( filePath ) => {
					result.total++;
					const destFile = filePath.replace( srcDir, destDir );
					const deps = dependencyMap[ destFile ] || [];

					// Extract license headers
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

					// Fix webpack-generated global registration to use export names instead of file names
					if (
						config.globalExportGeneration &&
						config.namespace &&
						config.srcDir &&
						fs.existsSync( destFile ) &&
						destFile.endsWith( '.js' )
					) {
						try {
							const srcDirPath = path.resolve( srcDir );
							const sourceFilePath = path.resolve( filePath );

							// Check if source file is within the configured source directory
							if ( sourceFilePath.startsWith( srcDirPath ) ) {
								const sourceContent = fs.readFileSync(
									filePath,
									'utf8'
								);
								const exports = parseExports( sourceContent );

								// Only fix if there's a default export with a name
								if ( exports.default && typeof exports.default === 'string' ) {
									let compiledContent = fs.readFileSync(
										destFile,
										'utf8'
									);

									// Generate directory path for namespace
									const relativePath = path.relative(
										srcDir,
										filePath
									);
									const pathParts = relativePath
										.replace( /\.(js|jsx)$/, '' )
										.split( path.sep );
									const dirPath = pathParts
										.slice( 0, -1 )
										.join( '.' );
									const fileName = pathParts[pathParts.length - 1];
									const exportName = exports.default;

									if ( dirPath && fileName !== exportName ) {
										// Replace file-name based registration with export-name based
										const fileBasedPattern = `window.${ config.namespace }.${ dirPath }.${ fileName }`;
										const exportBasedPattern = `window.${ config.namespace }.${ dirPath }.${ exportName }`;

										// Replace all occurrences of file-based registration
										compiledContent = compiledContent.replace(
											new RegExp(
												fileBasedPattern.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ),
												'g'
											),
											exportBasedPattern
										);

										fs.writeFileSync( destFile, compiledContent );
									}
								}
							}
						} catch ( e ) {
							// Fall back to default behavior
							if ( process.env.GRAB_DEPS_DEBUG ) {
								// eslint-disable-next-line no-console
								console.error(
									`[DEBUG] Failed to fix global registration for ${ filePath }:`,
									e
								);
							}
						}
					}
				} );
				return result;
			} );
		} );
}

// Export only the main public API functions
module.exports = {
	grabDeps,
	scanDir,
	dumpSetting,
	compileDirectory,
};
