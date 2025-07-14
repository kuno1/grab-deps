const { grabDeps, parseExports, generateGlobalRegistration } = require('../index.js');
const assert = require('assert');
const fs = require('fs');

describe('ES Module Export Detection', function() {
    let originalPackageJson;

    before(function() {
        // Backup original package.json
        originalPackageJson = fs.readFileSync('package.json', 'utf8');

        // Set test configuration
        const packageJson = JSON.parse(originalPackageJson);
        packageJson.grabDeps = {
            namespace: 'testns',
            srcDir: 'test/src',
            autoHandleGeneration: true,
            autoImportDetection: true,
            globalExportGeneration: true
        };
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, '\t'));
    });

    after(function() {
        // Restore original package.json
        fs.writeFileSync('package.json', originalPackageJson);
    });

    it('Should parse named exports from ES module', function() {
        const fileContent = fs.readFileSync('test/src/js/modules/date-utils.js', 'utf8');
        const exports = parseExports(fileContent);

        // Should detect named exports
        assert.ok(exports.named.includes('formatDate'));
        assert.ok(exports.named.includes('parseDate'));
        assert.ok(exports.named.includes('addDays'));

        // Should detect default export
        assert.ok(exports.default);
    });

    it('Should generate global registration code', function() {
        const fileContent = fs.readFileSync('test/src/js/modules/date-utils.js', 'utf8');
        const exports = parseExports(fileContent);
        const globalCode = generateGlobalRegistration(
            'test/src/js/modules/date-utils.js',
            'test/src',
            'testns',
            exports
        );

        // Should create namespace hierarchy
        assert.ok(globalCode.includes('window.testns = window.testns || {};'));
        assert.ok(globalCode.includes('window.testns.js = window.testns.js || {};'));
        assert.ok(globalCode.includes('window.testns.js.modules = window.testns.js.modules || {};'));

        // Should register named exports
        assert.ok(globalCode.includes('formatDate: formatDate'));
        assert.ok(globalCode.includes('parseDate: parseDate'));
        assert.ok(globalCode.includes('addDays: addDays'));

        // Should register default export
        assert.ok(globalCode.includes('default'));
    });

    it('Should detect namespace imports and generate dependencies', function() {
        const result = grabDeps('test/src/js/modules/app.js');

        // Should have correct handle name
        assert.strictEqual(result.handle, 'testns-js-modules-app');

        // Should include namespace import dependencies
        assert.ok(result.deps.includes('testns-js-modules-date-utils'));

        // Should not include relative imports
        assert.ok(!result.deps.includes('testns-js-modules-helper'));
    });

    it('Should handle files with complex export patterns', function() {
        const complexExportContent = `
            export const utils = {
                format: (data) => data,
                parse: (str) => str
            };

            export function helper() {
                return 'helper';
            }

            export class DataProcessor {
                process(data) {
                    return data;
                }
            }

            export default DataProcessor;
        `;

        const exports = parseExports(complexExportContent);

        // Should detect all export types
        assert.ok(exports.named.includes('utils'));
        assert.ok(exports.named.includes('helper'));
        assert.ok(exports.named.includes('DataProcessor'));
        assert.ok(exports.default);
    });
});
