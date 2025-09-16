const path = require( 'path' );
const { generateCamelCaseObjectPath } = require( './file-utils' );

/**
 * Generate handle name based on folder structure.
 *
 * @param {string} filePath  - File path relative to srcDir
 * @param {string} srcDir    - Source directory
 * @param {string} namespace - Namespace prefix
 * @return {string} Generated handle name with namespace prefix
 */
function generateHandleName( filePath, srcDir, namespace ) {
	// Remove srcDir from path and file extension
	const relativePath = path.relative( srcDir, filePath );
	const pathWithoutExt = relativePath.replace( /\.(js|jsx|css|scss)$/, '' );

	// Convert path separators to dashes
	const pathParts = pathWithoutExt.split( path.sep );
	const handleName = `${ namespace }-${ pathParts.join( '-' ) }`;

	return handleName;
}

/**
 * Generate global registration code for a module.
 *
 * @param {string} filePath  - Path to the module file
 * @param {string} srcDir    - Source directory
 * @param {string} namespace - Namespace prefix
 * @param {Object} exports   - Exported items from parseExports
 * @return {string} Global registration code for the module
 */
function generateGlobalRegistration( filePath, srcDir, namespace, exports ) {
	// Generate camelCase object path: js/components/test-es6-module.js -> components.testEs6Module
	const camelCaseObjectPath = generateCamelCaseObjectPath( filePath, srcDir );
	const globalPath = `window.${ namespace }.${ camelCaseObjectPath }`;

	let code = `// Global registration for ${ filePath }\n`;
	code += `window.${ namespace } = window.${ namespace } || {};\n`;

	// Create namespace hierarchy using camelCase
	const parts = camelCaseObjectPath.split( '.' );
	let currentPath = `window.${ namespace }`;

	for ( let i = 0; i < parts.length; i++ ) {
		currentPath += `.${ parts[ i ] }`;
		code += `${ currentPath } = ${ currentPath } || {};\n`;
	}

	// Register named exports
	if ( exports.named.length > 0 ) {
		code += `${ globalPath } = Object.assign( ${ globalPath }, {\n`;
		exports.named.forEach( ( exportName, index ) => {
			const comma = index < exports.named.length - 1 ? ',' : '';
			code += `\t${ exportName }: ${ exportName }${ comma }\n`;
		} );
		code += `} );\n`;
	}

	// Register default export
	if ( exports.default ) {
		if ( typeof exports.default === 'string' ) {
			// export default variableName - assign the variable directly to the global path
			code += `${ globalPath } = ${ exports.default };\n`;
		} else {
			// export default expression - assign to .default property
			code += `${ globalPath }.default = ${ globalPath }.default || {};\n`;
		}
	}

	return code;
}

module.exports = {
	generateHandleName,
	generateGlobalRegistration,
};
