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

		// Ensure test file exists (JS compilation test may have deleted the dist directory)
		const fs = require('fs');
		const path = require('path');
		const testFilePath = 'test/dist/js/pagination.js';

		if (!fs.existsSync(testFilePath)) {
			// Create directory if it doesn't exist
			fs.mkdirSync(path.dirname(testFilePath), { recursive: true });

			// Create the test file
			const testFileContent = `/**
 * Simple pagination component
 * This file should NOT have namespace applied since it's outside srcDir
 */

function pagination() {
    return {
        currentPage: 1,
        totalPages: 10,
        navigate: function(page) {
            this.currentPage = page;
        }
    };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pagination;
}`;
			fs.writeFileSync(testFilePath, testFileContent);
		}

		const result = grabDeps('test/dist/js/pagination.js');

		// Namespace should NOT be applied when file is outside srcDir
		assert.strictEqual(result.handle, 'pagination');

		process.cwd = originalCwd;
	});

	it('should apply namespace when srcDir is correctly configured', () => {
		// Test with config that matches the directory structure
		const originalCwd = process.cwd;
		process.cwd = () => '/Users/guy/Documents/GitHub/grab-deps';

		// Use existing test/assets/.grab-deps.json config file
		const result = grabDeps('test/assets/js/pagination.js', '', '0.0.0', 'test/assets/.grab-deps.json');

		// Namespace should be applied when srcDir is correctly configured
		assert.strictEqual(result.handle, 'hb-pagination');

		process.cwd = originalCwd;
	});
});
