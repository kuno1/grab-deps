const { grabDeps } = require('../index.js');
const assert = require('assert');
const fs = require('fs');

describe('Folder-based Handle Name Generation', function() {
    let originalPackageJson;

    before(function() {
        // Backup original package.json
        originalPackageJson = fs.readFileSync('package.json', 'utf8');

        // Set test configuration
        const packageJson = JSON.parse(originalPackageJson);
        packageJson.grabDeps = {
            namespace: 'kunoichi-grab-deps',
            srcDir: 'test/src',
            autoHandleGeneration: true
        };
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, '\t'));
    });

    after(function() {
        // Restore original package.json
        fs.writeFileSync('package.json', originalPackageJson);
    });

    it('Should generate handle name based on folder structure for JS files', function() {
        const result = grabDeps('test/src/js/multiple.js');
        assert.strictEqual(result.handle, 'kunoichi-grab-deps-js-multiple');
    });

    it('Should generate handle name for deep nested JS files', function() {
        const result = grabDeps('test/src/js/very/deep/file.js');
        assert.strictEqual(result.handle, 'kunoichi-grab-deps-js-very-deep-file');
    });

    it('Should generate handle name for CSS files', function() {
        const result = grabDeps('test/src/css/also/very/deep/file.css');
        assert.strictEqual(result.handle, 'kunoichi-grab-deps-css-also-very-deep-file');
    });

    it('Should use default handle name for files outside configured srcDir', function() {
        const result = grabDeps('test/assets/js/test-build-sample.js');
        assert.strictEqual(result.handle, 'test-build-sample');
    });

    it('Should handle files in srcDir root', function() {
        const result = grabDeps('test/src/js/no-deps.js');
        assert.strictEqual(result.handle, 'kunoichi-grab-deps-js-no-deps');
    });

    it('Should handle CSS files with media queries', function() {
        const result = grabDeps('test/src/css/css-media.css');
        assert.strictEqual(result.handle, 'kunoichi-grab-deps-css-css-media');
        assert.strictEqual(result.media, 'print');
    });
});
