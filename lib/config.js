const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Read grab-deps configuration from package.json or specified config file.
 *
 * @param {string} configPath Optional path to config file
 * @return {Object} Config object with namespace, srcDir and other configuration options
 */
function readGrabDepsConfig( configPath = null ) {
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

		// If config is found, return it
		if ( Object.keys( config ).length > 0 ) {
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

module.exports = {
	readGrabDepsConfig,
};
