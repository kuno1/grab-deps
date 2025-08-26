const assert = require( 'assert' );
const { compileDirectory } = require( '../index' );
const fs = require( 'fs' );

describe('JS compile test', function () {
	this.timeout(30000); // 30秒に延長

	let setting;

	const srcDir = 'test/src/js';
	const destDir = 'test/dist/js';

	// Prepare JS for compiling.
	before(async function () {
		this.timeout(30000); // 30秒に延長
		console.log('Starting JS compilation test...');
		console.log('Source directory:', srcDir);
		console.log('Destination directory:', destDir);
		console.log('CI environment:', process.env.CI);

		try {
			// Remove existing directory.
			if (fs.existsSync(destDir)) {
				console.log('Removing existing destination directory...');
				fs.rmSync(destDir, { recursive: true, force: true });
			}

			// Compile JS.
			console.log('Starting compileDirectory...');
			const startTime = Date.now();
			setting = await compileDirectory(srcDir, destDir, ['js', 'jsx'], 'test/assets/.grab-deps.json');
			const endTime = Date.now();
			console.log(`Compilation completed successfully in ${endTime - startTime}ms:`, setting);
		} catch (err) {
			console.error('Compilation failed:', err);
			console.error('Error stack:', err.stack);
			throw err;
		}
	});

	it('Are JS files compiled?', function () {
		// Is file exists?
		[
			'test-build-sample.js',
			'test-build-sample.js.LICENSE.txt',
			'test-build-block.jsx.js',
			'test-build-block.jsx.LICENSE.txt',
		].forEach( ( file ) => {
			assert.strictEqual(fs.existsSync( `${destDir}/${file}` ), true, `${file} exists` );
		});
	});

	it('ES6 export files should not be empty', function () {
		// Check that ES6 export files are not empty
		[
			'test-es6-export-issue.js',
			'test-es6-exports.js',
		].forEach( ( file ) => {
			const filePath = `${destDir}/${file}`;
			assert.strictEqual(fs.existsSync( filePath ), true, `${file} exists` );
			const content = fs.readFileSync( filePath, 'utf8' );
			assert.ok(content.length > 0, `${file} should not be empty (actual length: ${content.length})`);
		});
	});

	it('No *.asset.php', function () {
		// Is file exists?
		[
			'test-build-sample.js.asset.php',
			'test-build-block.jsx.asset.php',
		].forEach( ( file ) => {
			assert.strictEqual(fs.existsSync( `${destDir}/${file}` ), false, `${file} does not exist` );
		});
	});
});
