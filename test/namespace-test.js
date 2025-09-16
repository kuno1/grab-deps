const assert = require('assert');
const { grabDeps } = require('../index.js');
const fs = require('fs');
const path = require('path');

describe('Issue #37: namespace handling', () => {
	it('should apply namespace when file is within srcDir', () => {
		// Use default package.json config without path mocking
		const result = grabDeps('test/src/js/plugins/toast.js');

		// Namespace should be applied when file is within srcDir
		assert.strictEqual(result.handle, 'testns-js-plugins-toast');
	});

	it('should NOT apply namespace when file is outside srcDir', () => {
		// Ensure test file exists (JS compilation test may have deleted the dist directory)
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
	});

	it('should apply namespace when srcDir is correctly configured', () => {
		// Ensure test file exists for assets config
		const testFilePath = 'test/assets/js/pagination.js';

		if (!fs.existsSync(testFilePath)) {
			// Create directory if it doesn't exist
			fs.mkdirSync(path.dirname(testFilePath), { recursive: true });

			// Create the test file
			const testFileContent = `/**
 * Pagination component for assets test
 */

function pagination() {
    return {
        currentPage: 1,
        totalPages: 10
    };
}`;
			fs.writeFileSync(testFilePath, testFileContent);
		}

		// Use relative path to config file
		const configPath = path.join(process.cwd(), 'test/assets/.grab-deps.json');
		const result = grabDeps('test/assets/js/pagination.js', '', '0.0.0', configPath);

		// Namespace should be applied when srcDir is correctly configured
		assert.strictEqual(result.handle, 'hb-js-pagination');
	});
});
