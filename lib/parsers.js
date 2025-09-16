/**
 * Parse header to grab information.
 *
 * @param {Object}   object      Object to assign.
 * @param {string}   fileContent Line string to parse.
 * @param {string[]} deps        Additional dependencies.
 * @param {number}   maxScan     Maximum lines to scan.
 * @return {Object} Updated object with parsed header information
 */
function scanHeader( object, fileContent, deps, maxScan = 60 ) {
	if ( ! deps ) {
		deps = [];
	}
	const lines = fileContent.toString().split( '\n' );
	lines.forEach( ( line, i ) => {
		// If limit exceeded, stop scanning.
		if ( i + 1 > maxScan ) {
			return;
		}
		if (
			! line.match(
				/^[ *]*(wp|@)(deps|handle|version|footer|media|strategy|cssmedia)=?(.*)$/
			)
		) {
			// This is not header. Skip.
			return;
		}

		const key = RegExp.$2.trim();
		const value = RegExp.$3.trim();
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
				object.footer = ! ( 'false' === value );
				break;
			case 'deps':
				value.split( ',' ).forEach( ( dep ) => {
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
 * Parse export statements from file content.
 *
 * @param {string} fileContent - File content to parse
 * @return {Object} Object containing exported items with named, default, and reexports properties
 */
function parseExports( fileContent ) {
	const exports = {
		named: [], // Named exports: export const foo = ...
		default: null, // Default export: export default ...
		reexports: [], // Re-exports: export { foo } from './bar'
		renamed: {}, // Renamed exports: export { foo as bar }
	};

	// Match named exports: export const/let/var/function/class
	const namedExportRegex =
		/export\s+(?:const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
	let match;
	while ( ( match = namedExportRegex.exec( fileContent ) ) !== null ) {
		exports.named.push( match[ 1 ] );
	}

	// Match export statements: export { foo, bar } (without from clause)
	const exportStatementRegex = /export\s*\{\s*([^}]+)\s*\}(?!\s*from)/g;
	while ( ( match = exportStatementRegex.exec( fileContent ) ) !== null ) {
		const items = match[ 1 ].split( ',' ).map( ( item ) => {
			const parts = item.trim().split( /\s+as\s+/ );
			if ( parts.length === 2 ) {
				// Renamed export
				exports.renamed[ parts[ 1 ].trim() ] = parts[ 0 ].trim();
				return parts[ 1 ].trim(); // Export the renamed version
			}
			return parts[ 0 ].trim();
		} );
		exports.named.push( ...items );
	}

	// Match re-exports: export { foo } from './bar'
	const reexportRegex =
		/export\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g;
	while ( ( match = reexportRegex.exec( fileContent ) ) !== null ) {
		exports.reexports.push( {
			items: match[ 1 ].split( ',' ).map( ( item ) => item.trim() ),
			source: match[ 2 ],
		} );
	}

	// Match default export with variable name
	const defaultExportRegex = /export\s+default\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/;
	const defaultMatch = defaultExportRegex.exec( fileContent );
	if ( defaultMatch ) {
		exports.default = defaultMatch[ 1 ]; // variable name
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

module.exports = {
	scanHeader,
	parseExports,
};
