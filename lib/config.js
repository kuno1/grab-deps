const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Read grab-deps configuration from package.json or specified config file.
 *
 * @param {string} configPath Optional path to config file
 * @param {string} fileType   Optional file type ('js' or 'css') for file-specific config
 * @return {Object} Config object with namespace, srcDir and other configuration options
 */
function readGrabDepsConfig( configPath = null, fileType = null ) {
	// If config file is specified, use it directly
	if ( configPath ) {
		const resolvedPath = path.resolve( configPath );
		if ( fs.existsSync( resolvedPath ) ) {
			const ext = path.extname( resolvedPath );
			let config;

			if ( ext === '.json' ) {
				config = JSON.parse( fs.readFileSync( resolvedPath, 'utf8' ) );
			} else if ( ext === '.js' ) {
				config = require( resolvedPath );
			} else {
				throw new Error( `Unsupported config file format: ${ ext }` );
			}

			return {
				namespace: config.namespace || '',
				srcDir: config.srcDir || 'src',
				...config,
			};
		}
		throw new Error( `Config file not found: ${ resolvedPath }` );
	}

	// Fallback to package.json search (only in current working directory)
	const packageJsonPath = path.join( process.cwd(), 'package.json' );
	if ( fs.existsSync( packageJsonPath ) ) {
		const packageJson = JSON.parse(
			fs.readFileSync( packageJsonPath, 'utf8' )
		);
		const config = packageJson.grabDeps || {};

		// If config is found, process it
		if ( Object.keys( config ).length > 0 ) {
			// Check if it's file-type specific configuration
			if ( config.js || config.css ) {
				return getFileTypeConfig( config, fileType );
			}

			// Legacy single configuration format
			return {
				namespace: config.namespace || '',
				srcDir: config.srcDir || 'src',
				...config,
			};
		}
	}

	// Return empty config if no grabDeps config found
	return {};
}

/**
 * Get file-type specific configuration.
 *
 * @param {Object} config   Raw configuration object
 * @param {string} fileType File type ('js' or 'css')
 * @return {Object} File-type specific configuration
 */
function getFileTypeConfig( config, fileType ) {
	// Default configuration (merged with file-type specific)
	const defaultConfig = {
		namespace: config.namespace || '',
		srcDir: config.srcDir || 'src',
		autoHandleGeneration: config.autoHandleGeneration || false,
		globalExportGeneration: config.globalExportGeneration || false,
	};

	// If no file type specified, return default config
	if ( ! fileType ) {
		return { ...defaultConfig, ...config };
	}

	// Get file-type specific config
	const fileTypeConfig = config[ fileType ] || {};

	// Merge: default config < general config < file-type specific config
	return {
		...defaultConfig,
		...( config.namespace && { namespace: config.namespace } ),
		...fileTypeConfig,
	};
}

module.exports = {
	readGrabDepsConfig,
	getFileTypeConfig,
};
