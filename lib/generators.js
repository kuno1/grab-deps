const path = require( 'path' );

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
 * Convert namespace import path to handle name.
 *
 * @param {string} importPath - Namespace import path (e.g., @mylib/utils/date)
 * @param {string} namespace  - Namespace prefix
 * @return {string} - Handle name
 */
function convertNamespaceImportToHandle( importPath, namespace ) {
	// Remove @namespace/ prefix and convert to handle format
	const pathWithoutNamespace = importPath.replace( `@${ namespace }/`, '' );
	const handleName = `${ namespace }-${ pathWithoutNamespace.replace(
		/\//g,
		'-'
	) }`;

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
	// Generate namespace path: @namespace/utils/date -> window.namespace.utils.date
	const relativePath = path.relative( srcDir, filePath );
	const pathWithoutExt = relativePath.replace( /\.(js|jsx|ts|tsx)$/, '' );
	const namespaceParts = pathWithoutExt.split( path.sep );

	// Check if any part contains special characters
	const hasSpecialChars = namespaceParts.some( ( part ) =>
		/[^a-zA-Z0-9_$]/.test( part )
	);

	let code = `// Global registration for ${ filePath }\n`;

	if ( hasSpecialChars ) {
		// Use bracket notation for paths with special characters
		code += `window.${ namespace } = window.${ namespace } || {};\n`;

		// Build up the namespace path with bracket notation
		let currentPath = `window.${ namespace }`;
		for ( let i = 0; i < namespaceParts.length; i++ ) {
			const part = namespaceParts[ i ];
			if ( /[^a-zA-Z0-9_$]/.test( part ) ) {
				currentPath += `['${ part }']`;
			} else {
				currentPath += `.${ part }`;
			}
			code += `${ currentPath } = ${ currentPath } || {};\n`;
		}

		// Register exports with existence check
		if ( exports.named.length > 0 ) {
			code += `(function() {\n`;
			exports.named.forEach( ( exportName ) => {
				code += `\tif (typeof ${ exportName } !== 'undefined') {\n`;
				code += `\t\t${ currentPath }.${ exportName } = ${ exportName };\n`;
				code += `\t}\n`;
			} );
			code += `})();\n`;
		}

		// Register default export
		if ( exports.default ) {
			if ( typeof exports.default === 'string' ) {
				code += `(function() {\n`;
				code += `\tif (typeof ${ exports.default } !== 'undefined') {\n`;
				code += `\t\t${ currentPath } = ${ exports.default };\n`;
				code += `\t}\n`;
				code += `})();\n`;
			} else {
				code += `// Default export (expression) should be handled by the build process\n`;
			}
		}
	} else {
		// Use dot notation for clean paths (original test case)
		const globalPath = `window.${ namespace }.${ namespaceParts.join(
			'.'
		) }`;

		// Create namespace hierarchy
		const parts = [ namespace, ...namespaceParts ];
		for ( let i = 0; i < parts.length; i++ ) {
			const currentPath = `window.${ parts
				.slice( 0, i + 1 )
				.join( '.' ) }`;
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
	}

	return code;
}

module.exports = {
	generateHandleName,
	convertNamespaceImportToHandle,
	generateGlobalRegistration,
};
