const { grabDeps } = require('../index.js');
const assert = require('assert');
const fs = require('fs');

describe('Import Statement Detection', function() {
    let originalPackageJson;

    before(function() {
        // Backup original package.json
        originalPackageJson = fs.readFileSync('package.json', 'utf8');

        // Set test configuration (use "testns" to match import statements)
        const packageJson = JSON.parse(originalPackageJson);
        packageJson.grabDeps = {
            namespace: 'testns',
            srcDir: 'test/src',
            autoHandleGeneration: true,
            autoImportDetection: true
        };
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, '\t'));
    });

    after(function() {
        // Restore original package.json
        fs.writeFileSync('package.json', originalPackageJson);
    });

    it('Should detect namespace import statements and add to dependencies', function() {
        const result = grabDeps('test/src/js/import-test.js');

        // Should include dependencies from namespace import statements
        assert.ok(result.deps.includes('testns-utils-date'));
        assert.ok(result.deps.includes('testns-js-very-deep-util'));

        // Should not include relative imports (processed by webpack)
        assert.ok(!result.deps.includes('testns-js-utils-helper'));
        assert.ok(!result.deps.includes('testns-components-ui'));

        // Should not include external dependencies (axios, react)
        assert.ok(!result.deps.includes('axios'));
        assert.ok(!result.deps.includes('react'));
    });

    it('Should generate proper handle name for import test file', function() {
        const result = grabDeps('test/src/js/import-test.js');
        assert.strictEqual(result.handle, 'testns-js-import-test');
    });

    it('Should handle import statements with autoImportDetection disabled', function() {
        // Temporarily disable auto import detection
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.grabDeps.autoImportDetection = false;
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, '\t'));

        const result = grabDeps('test/src/js/import-test.js');

        // Should not include namespace import dependencies
        assert.ok(!result.deps.includes('testns-utils-date'));
        assert.ok(!result.deps.includes('testns-js-very-deep-util'));

        // Restore auto import detection
        packageJson.grabDeps.autoImportDetection = true;
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, '\t'));
    });

    it('Should handle files without import statements', function() {
        const result = grabDeps('test/src/js/no-deps.js');

        // Should have namespace-based handle name
        assert.strictEqual(result.handle, 'testns-js-no-deps');

        // Should not have any import-based dependencies
        assert.strictEqual(result.deps.length, 0);
    });
});
