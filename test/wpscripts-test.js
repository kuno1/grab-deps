const assert = require( 'assert' );
const { compileDirectory } = require( '../index' );
const fs = require( 'fs' );

describe('JS compile test', function () {
	this.timeout(30000); // 30秒に延長

	let setting;

	const srcDir = 'test/assets/js';
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
			setting = await compileDirectory(srcDir, destDir);
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
