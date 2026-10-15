const assert = require( 'assert' );
const { toCamelCase, generateCamelCaseObjectPath } = require( '../lib/file-utils' );

describe( 'File Utilities', () => {
	describe( 'toCamelCase', () => {
		it( 'Should convert kebab-case to camelCase', () => {
			assert.strictEqual( toCamelCase( 'test-module' ), 'testModule' );
			assert.strictEqual( toCamelCase( 'es6-export-issue' ), 'es6ExportIssue' );
			assert.strictEqual( toCamelCase( 'multi-word-test-case' ), 'multiWordTestCase' );
		} );

		it( 'Should convert snake_case to camelCase', () => {
			assert.strictEqual( toCamelCase( 'test_module' ), 'testModule' );
			assert.strictEqual( toCamelCase( 'es6_export_issue' ), 'es6ExportIssue' );
			assert.strictEqual( toCamelCase( 'multi_word_test_case' ), 'multiWordTestCase' );
		} );

		it( 'Should handle mixed separators', () => {
			assert.strictEqual( toCamelCase( 'test-module_name' ), 'testModuleName' );
			assert.strictEqual( toCamelCase( 'es6_export-issue' ), 'es6ExportIssue' );
		} );

		it( 'Should handle single words', () => {
			assert.strictEqual( toCamelCase( 'module' ), 'module' );
			assert.strictEqual( toCamelCase( 'Component' ), 'component' );
		} );

		it( 'Should handle empty string', () => {
			assert.strictEqual( toCamelCase( '' ), '' );
		} );

		it( 'Should handle strings with multiple consecutive separators', () => {
			assert.strictEqual( toCamelCase( 'test--module' ), 'testModule' );
			assert.strictEqual( toCamelCase( 'test__module' ), 'testModule' );
			assert.strictEqual( toCamelCase( 'test-_-module' ), 'testModule' );
		} );

		it( 'Should handle strings starting with separator', () => {
			assert.strictEqual( toCamelCase( '-test-module' ), 'testModule' );
			assert.strictEqual( toCamelCase( '_test_module' ), 'testModule' );
		} );

		it( 'Should handle strings ending with separator', () => {
			assert.strictEqual( toCamelCase( 'test-module-' ), 'testModule' );
			assert.strictEqual( toCamelCase( 'test_module_' ), 'testModule' );
		} );
	} );

	describe( 'generateCamelCaseObjectPath', () => {
		it( 'Should generate camelCase object path from file path', () => {
			const result = generateCamelCaseObjectPath( 'js/components/test-es6-module.js', 'js' );
			assert.strictEqual( result, 'components.testEs6Module' );
		} );

		it( 'Should handle nested directories', () => {
			const result = generateCamelCaseObjectPath( 'src/js/utils/helper-functions.js', 'src/js' );
			assert.strictEqual( result, 'utils.helperFunctions' );
		} );

		it( 'Should handle root level files', () => {
			const result = generateCamelCaseObjectPath( 'js/main-app.js', 'js' );
			assert.strictEqual( result, 'mainApp' );
		} );

		it( 'Should handle different file extensions', () => {
			assert.strictEqual( generateCamelCaseObjectPath( 'src/test-module.jsx', 'src' ), 'testModule' );
			assert.strictEqual( generateCamelCaseObjectPath( 'src/test-module.ts', 'src' ), 'testModule' );
			assert.strictEqual( generateCamelCaseObjectPath( 'src/test-module.tsx', 'src' ), 'testModule' );
		} );

		it( 'Should handle deep nested structure', () => {
			const result = generateCamelCaseObjectPath( 'src/js/components/ui/button-group.js', 'src/js' );
			assert.strictEqual( result, 'components.ui.buttonGroup' );
		} );

		it( 'Should handle snake_case directories', () => {
			const result = generateCamelCaseObjectPath( 'src/js/user_profile/settings_panel.js', 'src/js' );
			assert.strictEqual( result, 'userProfile.settingsPanel' );
		} );

		it( 'Should handle mixed separators in path', () => {
			const result = generateCamelCaseObjectPath( 'src/js/form-components/input_field.js', 'src/js' );
			assert.strictEqual( result, 'formComponents.inputField' );
		} );

		it( 'Should handle Windows-style paths', () => {
			// Windows path test - using path.resolve to handle cross-platform
			const result = generateCamelCaseObjectPath( 'src/js/components/test-module.js', 'src/js' );
			assert.strictEqual( result, 'components.testModule' );
		} );
	} );
} );

describe( 'extractHeaderToLicense', () => {
	const fs = require( 'fs' );
	const os = require( 'os' );
	const path = require( 'path' );
	const { extractHeaderToLicense } = require( '../lib/file-utils' );

	it( 'Should ignore empty handles in deps', () => {
		const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'grab-deps-' ) );
		const file = path.join( dir, 'sample.js' );
		fs.writeFileSync( file, '/*!\n * @handle sample\n * @deps jquery\n */\nconsole.log( 1 );\n' );
		extractHeaderToLicense( file, dir, dir, [ '', 'wp-i18n', ' ' ] );
		const license = fs.readFileSync( file + '.LICENSE.txt', 'utf8' );
		assert.ok( license.includes( '@deps jquery, wp-i18n\n' ), license );
		fs.rmSync( dir, { recursive: true, force: true } );
	} );
} );

describe( 'extractHeaderToLicense with only empty deps', () => {
	const fs = require( 'fs' );
	const os = require( 'os' );
	const path = require( 'path' );
	const { extractHeaderToLicense } = require( '../lib/file-utils' );

	it( 'Should keep the original header untouched', () => {
		const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'grab-deps-' ) );
		const file = path.join( dir, 'sample.js' );
		const header = '/*!\n * @handle sample\n * @deps jquery\n */';
		fs.writeFileSync( file, header + '\nconsole.log( 1 );\n' );
		extractHeaderToLicense( file, dir, dir, [ '' ] );
		assert.strictEqual( fs.readFileSync( file + '.LICENSE.txt', 'utf8' ), header );
		fs.rmSync( dir, { recursive: true, force: true } );
	} );
} );

describe( 'extractHeaderToLicense with JSX source', () => {
	const fs = require( 'fs' );
	const os = require( 'os' );
	const path = require( 'path' );
	const { extractHeaderToLicense } = require( '../lib/file-utils' );

	it( 'Should name LICENSE.txt after the compiled .js file', () => {
		const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'grab-deps-' ) );
		const file = path.join( dir, 'block.jsx' );
		fs.writeFileSync( file, '/*!\n * @handle block\n */\nconsole.log( 1 );\n' );
		extractHeaderToLicense( file, dir, dir, [ 'wp-element' ] );
		assert.ok( fs.existsSync( path.join( dir, 'block.js.LICENSE.txt' ) ) );
		assert.ok( ! fs.existsSync( path.join( dir, 'block.jsx.LICENSE.txt' ) ) );
		fs.rmSync( dir, { recursive: true, force: true } );
	} );
} );
