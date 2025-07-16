const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Read grab-deps configuration from package.json.
 *
 * @return {Object} Config object with namespace, srcDir and other configuration options
 */
function readGrabDepsConfig() {
	const packageJsonPath = path.join( process.cwd(), 'package.json' );
	if ( ! fs.existsSync( packageJsonPath ) ) {
		return {};
	}

	const packageJson = JSON.parse(
		fs.readFileSync( packageJsonPath, 'utf8' )
	);
	const config = packageJson.grabDeps || {};

	// Set default values
	return {
		namespace: config.namespace || '', // No default namespace - must be explicitly set
		srcDir: config.srcDir || 'src',
		...config,
	};
}

module.exports = {
	readGrabDepsConfig,
};
