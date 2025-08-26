const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { compileDirectory } = require('../index');

describe('File System Watch Compatibility', function() {
	this.timeout(10000);

	const sourceDir = 'test/src/js';
	const destDir = 'test/dist/js';

	beforeEach(function() {
		// Clean up destination directory
		if (fs.existsSync(destDir)) {
			fs.rmSync(destDir, { recursive: true, force: true });
		}
	});

	afterEach(function() {
		// Clean up any potential backup files
		const cleanupPatterns = [
			'**/*.backup',
			'**/*.backup.*',
			'**/*.temp',
			'**/*.tmp'
		];

		cleanupPatterns.forEach(pattern => {
			const glob = require('glob');
			const files = glob.sync(pattern, { cwd: sourceDir });
			files.forEach(file => {
				const filePath = path.join(sourceDir, file);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			});
		});
	});

	it('should not create .backup files during compilation', async function() {
		const beforeFiles = getAllFiles(sourceDir);

		// Run compilation
		await compileDirectory(sourceDir, destDir, ['js', 'jsx'], process.cwd() + '/test/assets/.grab-deps.json');

		const afterFiles = getAllFiles(sourceDir);

		// Check that no .backup files were created
		const backupFiles = afterFiles.filter(file =>
			file.includes('.backup') ||
			file.includes('.temp') ||
			file.includes('.tmp')
		);

		assert.strictEqual(backupFiles.length, 0, `Backup files found: ${backupFiles.join(', ')}`);
		assert.strictEqual(afterFiles.length, beforeFiles.length, 'File count changed during compilation');
	});

	it('should not leave temporary files in source directory', async function() {
		const initialFiles = getAllFiles(sourceDir);

		// Run compilation multiple times to simulate watch scenario
		for (let i = 0; i < 3; i++) {
			await compileDirectory(sourceDir, destDir, ['js', 'jsx'], process.cwd() + '/test/assets/.grab-deps.json');
		}

		const finalFiles = getAllFiles(sourceDir);

		// Verify no additional files were created
		assert.strictEqual(finalFiles.length, initialFiles.length, 'File count changed during multiple compilations');

		// Verify specific patterns don't exist
		const tempPatterns = ['.backup', '.temp', '.tmp', '.bak', '.orig'];
		finalFiles.forEach(file => {
			tempPatterns.forEach(pattern => {
				assert.ok(!file.includes(pattern), `Temporary file found: ${file}`);
			});
		});
	});

	it('should maintain source file integrity during compilation', async function() {
		const testFiles = [
			'test-es6-export-issue.js',
			'test-es6-exports.js',
			'test-build-sample.js'
		];

		// Get original file contents
		const originalContents = {};
		testFiles.forEach(file => {
			const filePath = path.join(sourceDir, file);
			if (fs.existsSync(filePath)) {
				originalContents[file] = fs.readFileSync(filePath, 'utf8');
			}
		});

		// Run compilation
		await compileDirectory(sourceDir, destDir, ['js', 'jsx'], process.cwd() + '/test/assets/.grab-deps.json');

		// Verify source files are unchanged
		testFiles.forEach(file => {
			const filePath = path.join(sourceDir, file);
			if (fs.existsSync(filePath)) {
				const currentContent = fs.readFileSync(filePath, 'utf8');
				assert.strictEqual(currentContent, originalContents[file],
					`Source file ${file} was modified during compilation`);
			}
		});
	});

	it('should handle rapid successive compilations without file conflicts', async function() {
		this.timeout(20000); // Increase timeout for sequential compilations

		// Simulate rapid sequential compilation (more realistic for npm-watch)
		const compilationResults = [];

		for (let i = 0; i < 3; i++) {
			try {
				const result = await compileDirectory(sourceDir, destDir, ['js', 'jsx'], process.cwd() + '/test/assets/.grab-deps.json');
				compilationResults.push({ status: 'fulfilled', result });
			} catch (error) {
				compilationResults.push({ status: 'rejected', error });
			}
		}

		// Verify all compilations succeeded
		compilationResults.forEach((result, index) => {
			assert.strictEqual(result.status, 'fulfilled',
				`Compilation ${index + 1} failed: ${result.error?.message || 'Unknown error'}`);
		});

		// Verify no temporary files remain
		const finalFiles = getAllFiles(sourceDir);
		const tempFiles = finalFiles.filter(file =>
			file.includes('.backup') ||
			file.includes('.temp') ||
			file.includes('.tmp') ||
			file.includes('.bak')
		);

		assert.strictEqual(tempFiles.length, 0, `Temporary files found: ${tempFiles.join(', ')}`);
	});
});

/**
 * Helper function to get all files in a directory recursively
 */
function getAllFiles(dir) {
	const files = [];

	function traverse(currentDir) {
		const items = fs.readdirSync(currentDir);

		items.forEach(item => {
			const fullPath = path.join(currentDir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				traverse(fullPath);
			} else {
				files.push(fullPath);
			}
		});
	}

	if (fs.existsSync(dir)) {
		traverse(dir);
	}

	return files;
}
