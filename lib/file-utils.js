const fs = require( 'fs' );

/**
 * Extract license header from JS file.
 *
 * @param {string}   filePath
 * @param {string}   src
 * @param {string}   dest
 * @param {string[]} deps     - Dependencies from asset.php
 * @return {boolean} True if license.txt is generated.
 */
function extractHeaderToLicense( filePath, src, dest, deps = [] ) {
	const target = filePath.replace( src, dest ) + '.LICENSE.txt';
	const content = fs.readFileSync( filePath, 'utf8' );
	if ( ! content ) {
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
			const existingDepsMatch = licenseContent.match(
				/^\s*\*\s*@deps\s+([^\n*]+)/gm
			);
			if ( existingDepsMatch ) {
				existingDepsMatch.forEach( ( found ) => {
					const depsLine = found
						.replace( /^\s*\*\s*@deps\s+/, '' )
						.trim();
					depsLine.split( ',' ).forEach( ( dep ) => {
						const trimmedDep = dep.trim();
						if (
							trimmedDep &&
							! existingDeps.includes( trimmedDep )
						) {
							existingDeps.push( trimmedDep );
						}
					} );
				} );
			}
		}

		// 新しい依存関係を追加（重複を除去）
		const allDeps = [ ...existingDeps ];
		deps.forEach( ( dep ) => {
			if ( ! allDeps.includes( dep ) ) {
				allDeps.push( dep );
			}
		} );

		if ( allDeps.length > 0 ) {
			if ( licenseContent ) {
				// 既存のライセンスヘッダーから @deps 行を削除
				licenseContent = licenseContent.replace(
					/^\s*\*\s*@deps\s+[^*\n]+\n?/gm,
					''
				);
				// 統合された依存関係情報を追加
				const depsComment = `\n/*!\n * @deps ${ allDeps.join(
					', '
				) }\n */`;
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
 * Convert kebab-case or snake_case string to camelCase.
 *
 * @param {string} str - String to convert
 * @return {string} CamelCase string
 */
function toCamelCase( str ) {
	return str
		.replace( /[-_]+(.)?/g, ( match, char ) => {
			return char ? char.toUpperCase() : '';
		} )
		.replace( /^[A-Z]/, ( match ) => match.toLowerCase() );
}

/**
 * Convert file path to camelCase object path.
 * Example: "js/components/test-es6-module.js" -> "components.testEs6Module"
 *
 * @param {string} filePath - File path relative to srcDir
 * @param {string} srcDir   - Source directory path
 * @return {string} CamelCase object path
 */
function generateCamelCaseObjectPath( filePath, srcDir ) {
	const path = require( 'path' );

	// Get relative path from srcDir and remove file extension
	const relativePath = path.relative( srcDir, filePath );
	const pathWithoutExt = relativePath.replace( /\.(js|jsx|ts|tsx)$/, '' );

	// Split into parts and convert each part to camelCase
	const parts = pathWithoutExt.split( path.sep );
	const camelCaseParts = parts.map( ( part ) => toCamelCase( part ) );

	// Join with dots to create object path
	return camelCaseParts.join( '.' );
}

module.exports = {
	extractHeaderToLicense,
	toCamelCase,
	generateCamelCaseObjectPath,
};
