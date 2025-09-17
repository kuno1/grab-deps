const assert = require('assert');
const { compileDirectory, grabDeps } = require('../index');
const fs = require('fs');
const path = require('path');

describe('Assets Build Test (Alternative Configuration)', function () {
    this.timeout(30000); // 30秒に延長

    const srcDir = 'test/assets/js';
    const destDir = 'test/build/js';
    let compilationResult;

    // アセット用のビルド準備
    before(async function () {
        this.timeout(30000);
        console.log('Starting Assets build test...');
        console.log('Source directory:', srcDir);
        console.log('Destination directory:', destDir);

        try {
            // Remove existing directory
            if (fs.existsSync(destDir)) {
                console.log('Removing existing destination directory...');
                fs.rmSync(destDir, { recursive: true, force: true });
            }

            // Compile JS with alternative configuration
            console.log('Starting compileDirectory for assets...');
            const startTime = Date.now();
            compilationResult = await compileDirectory(srcDir, destDir, ['js'], 'test/assets/.grab-deps.json');
            const endTime = Date.now();
            console.log(`Assets compilation completed in ${endTime - startTime}ms:`, compilationResult);
        } catch (err) {
            console.error('Assets compilation failed:', err);
            throw err;
        }
    });

    it('Should compile modal.js with "hb" namespace', function () {
        const modalFile = path.join(destDir, 'modal.js');
        assert.ok(fs.existsSync(modalFile), 'modal.js should exist');

        const content = fs.readFileSync(modalFile, 'utf8');
        console.log('Modal.js content (first 200 chars):', content.substring(0, 200));

        // Should use "hb" namespace instead of "testns"
        assert.ok(content.includes('globalThis.hb'), 'Should use "hb" namespace');
        assert.ok(!content.includes('globalThis.testns'), 'Should not use "testns" namespace');

        // Should contain the exported components
        assert.ok(content.includes('Modal') && content.includes('ModalManager') && content.includes('createModal'),
            'Should contain exported components');
    });

    it('Should compile button.js with components namespace', function () {
        const buttonFile = path.join(destDir, 'components', 'button.js');
        assert.ok(fs.existsSync(buttonFile), 'button.js should exist');

        const content = fs.readFileSync(buttonFile, 'utf8');
        console.log('Button.js content (first 200 chars):', content.substring(0, 200));

        // Should use "hb.components" namespace structure
        assert.ok(content.includes('globalThis.hb.components'), 'Should use "hb.components" namespace');
        assert.ok(content.includes('Button') && content.includes('PrimaryButton'),
            'Should contain exported components');
    });

    it('Should generate proper dependency info with grabDeps', function () {
        const modalFile = path.join(destDir, 'modal.js');
        const result = grabDeps(modalFile, '', '0.0.0', 'test/assets/.grab-deps.json');

        console.log('GrabDeps result for modal.js:', result);

        // Should use alternative configuration settings
        assert.strictEqual(result.handle, 'assets-modal', 'Should use @handle from file header');
        assert.strictEqual(result.version, '1.2.0', 'Should use @version from file header');

        // Should apply namespace-based handle generation when @handle is not specified
        const buttonFile = path.join(destDir, 'components', 'button.js');
        const buttonResult = grabDeps(buttonFile, '', '0.0.0', 'test/assets/.grab-deps.json');

        console.log('GrabDeps result for button.js:', buttonResult);
        assert.ok(buttonResult.handle.includes('hb'), 'Button handle should include namespace');
    });

    it('Should not be empty files (Issue #42 verification)', function () {
        // Verify that both files are not empty and contain actual code
        const modalFile = path.join(destDir, 'modal.js');
        const buttonFile = path.join(destDir, 'components', 'button.js');

        const modalContent = fs.readFileSync(modalFile, 'utf8');
        const buttonContent = fs.readFileSync(buttonFile, 'utf8');

        assert.ok(modalContent.length > 100, `Modal file should not be empty (actual: ${modalContent.length} chars)`);
        assert.ok(buttonContent.length > 100, `Button file should not be empty (actual: ${buttonContent.length} chars)`);

        // Should contain actual functionality, not just webpack runtime
        assert.ok(modalContent.includes('isOpen') || modalContent.includes('open') || modalContent.includes('close'),
            'Modal should contain actual functionality');
        assert.ok(buttonContent.includes('render') || buttonContent.includes('Button'),
            'Button should contain actual functionality');
    });

    it('Should handle different srcDir configurations', function () {
        // This test verifies that the webpack loader correctly handles
        // different srcDir configurations (test/assets/js vs test/src/js)
        const modalFile = path.join(destDir, 'modal.js');
        const content = fs.readFileSync(modalFile, 'utf8');

        // The namespace and structure should be correct despite different srcDir
        assert.ok(content.includes('globalThis.hb'), 'Should handle alternative srcDir configuration');
    });

    after(function() {
        // Clean up - remove test/build directory
        if (fs.existsSync('test/build')) {
            console.log('Cleaning up test/build directory...');
            fs.rmSync('test/build', { recursive: true, force: true });
        }
    });
});
