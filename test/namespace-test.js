const assert = require('assert');
const { grabDeps } = require('../index.js');

describe('Issue #37: namespace handling', () => {
	it('should apply namespace when file is within srcDir', () => {
		// Mock package.json with grabDeps config
		const originalCwd = process.cwd;
		process.cwd = () => '/Users/guy/Documents/GitHub/grab-deps';

		const result = grabDeps('test/src/js/plugins/toast.js');

		// Namespace should be applied when file is within srcDir
		assert.strictEqual(result.handle, 'hb-plugins-toast');

		process.cwd = originalCwd;
	});

	it('should NOT apply namespace when file is outside srcDir', () => {
		// Mock package.json with grabDeps config
		const originalCwd = process.cwd;
		process.cwd = () => '/Users/guy/Documents/GitHub/grab-deps';

		const result = grabDeps('test/assets/js/pagination.js');

		// Namespace should NOT be applied when file is outside srcDir
		assert.strictEqual(result.handle, 'pagination');

		process.cwd = originalCwd;
	});

	it('should apply namespace when srcDir is correctly configured', () => {
		// Test with config that matches the directory structure
		const originalCwd = process.cwd;
		process.cwd = () => '/Users/guy/Documents/GitHub/grab-deps';

		// Create a temporary config file for this test
		const fs = require('fs');
		const testConfig = {
			namespace: 'hb',
			srcDir: 'test/assets/js',
			autoHandleGeneration: true
		};

		fs.writeFileSync('.grab-deps-test.json', JSON.stringify(testConfig));

		const result = grabDeps('test/assets/js/pagination.js', '', '0.0.0', '.grab-deps-test.json');

		// Namespace should be applied when srcDir is correctly configured
		assert.strictEqual(result.handle, 'hb-pagination');

		// Clean up
		fs.unlinkSync('.grab-deps-test.json');
		process.cwd = originalCwd;
	});
});
