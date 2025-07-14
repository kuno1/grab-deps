const assert = require( 'assert' );
const { compileDirectory } = require( '../index' );
const fs = require( 'fs' );

describe('JS compile test', function () {
	this.timeout(5000); // 長めの処理を許容する

	let setting;

	const srcDir = 'test/assets/js';
	const destDir = 'test/dist/js';

	// Prepare JS for compiling.
	before(function (done) {
		// Remove existing directory.
		if (fs.existsSync(destDir)) {
			fs.rmSync(destDir, { recursive: true, force: true });
		}
		// Compile JS.
		compileDirectory(srcDir, destDir)
			.then(result => {
				setting = result;
				done();
			})
			.catch(err => done(err));
	});

	it('Are JS files compiled?', function () {
		// Is file exists?
		[
			'test-build-sample.js',
			'test-build-sample.LICENSE.txt',
			'test-build-block.jsx.js',
			'test-build-block.LICENSE.txt',
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
