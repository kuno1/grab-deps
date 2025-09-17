const assert = require('assert');
const { grabDeps } = require('../index.js');
const fs = require('fs');
const path = require('path');

describe('Issue #37: namespace handling', () => {

	it('should apply namespace when file is within srcDir', () => {
		// Use default package.json config without path mocking
		const result = grabDeps('test/src/js/plugins/toast.js');

		// Namespace should be applied when file is within srcDir
		assert.strictEqual(result.handle, 'testns-plugins-toast');
	});

	it('should apply namespace for css', () => {
		// Use default package.json config without path mocking
		const result = grabDeps('test/src/css/css-media.css');

		// Namespace should be applied when file is within srcDir
		assert.strictEqual(result.handle, 'testns-css-media');
	});

	it('should NOT apply namespace when file is outside srcDir', () => {
		const result = grabDeps('test/src/utils/date.js');

		// Namespace should NOT be applied when file is outside srcDir
		assert.strictEqual(result.handle, 'date');
	});

	it('should apply namespace when srcDir is correctly configured', () => {
		// Use relative path to config file
		const configPath = path.join(process.cwd(), 'test/assets/.grab-deps.json');
		const result = grabDeps('test/assets/js/pagination.js', '', '0.0.0', configPath);

		// Namespace should be applied when srcDir is correctly configured
		assert.strictEqual(result.handle, 'hb-pagination');
	});
});
