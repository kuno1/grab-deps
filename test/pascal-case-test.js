const assert = require('assert');
const { generateCamelCaseObjectPath, toCamelCase } = require('../lib/file-utils');

describe('PascalCase Component Name Handling', function() {

	describe('toCamelCase function', function() {
		it('should convert kebab-case to camelCase by default', function() {
			assert.strictEqual(toCamelCase('my-component'), 'myComponent');
			assert.strictEqual(toCamelCase('test-es6-module'), 'testEs6Module');
		});

		it('should preserve PascalCase when preservePascalCase is true', function() {
			assert.strictEqual(toCamelCase('PascalCaseComponent', true), 'PascalCaseComponent');
			assert.strictEqual(toCamelCase('MyComponent', true), 'MyComponent');
		});

		it('should convert to camelCase when preservePascalCase is false', function() {
			assert.strictEqual(toCamelCase('PascalCaseComponent', false), 'pascalCaseComponent');
			assert.strictEqual(toCamelCase('MyComponent', false), 'myComponent');
		});
	});

	describe('generateCamelCaseObjectPath function', function() {
		it('should preserve PascalCase for filenames', function() {
			const result = generateCamelCaseObjectPath(
				'test/src/js/components/PascalCaseComponent.js',
				'test/src/js'
			);
			assert.strictEqual(result, 'components.PascalCaseComponent');
		});

		it('should convert kebab-case filenames to camelCase', function() {
			const result = generateCamelCaseObjectPath(
				'test/src/js/components/my-test-component.js',
				'test/src/js'
			);
			assert.strictEqual(result, 'components.myTestComponent');
		});

		it('should preserve PascalCase filenames while converting directory names', function() {
			const result = generateCamelCaseObjectPath(
				'test/src/js/my-components/PascalCaseComponent.js',
				'test/src/js'
			);
			assert.strictEqual(result, 'myComponents.PascalCaseComponent');
		});

		it('should handle mixed cases correctly', function() {
			const result = generateCamelCaseObjectPath(
				'test/src/js/ui-components/LoadingIndicator.js',
				'test/src/js'
			);
			assert.strictEqual(result, 'uiComponents.LoadingIndicator');
		});

		it('should preserve multiple PascalCase words', function() {
			const result = generateCamelCaseObjectPath(
				'test/src/js/components/MyAwesomeComponent.js',
				'test/src/js'
			);
			assert.strictEqual(result, 'components.MyAwesomeComponent');
		});

		it('should handle single word PascalCase', function() {
			const result = generateCamelCaseObjectPath(
				'test/src/js/components/Button.js',
				'test/src/js'
			);
			assert.strictEqual(result, 'components.Button');
		});

		it('should not preserve mixed case that is not proper PascalCase', function() {
			// This should be converted because it's not proper PascalCase
			const result = generateCamelCaseObjectPath(
				'test/src/js/components/myComponent.js',
				'test/src/js'
			);
			assert.strictEqual(result, 'components.myComponent');
		});
	});

	describe('React component naming conventions', function() {
		it('should handle typical React component names', function() {
			const testCases = [
				{ input: 'test/src/js/components/Pagination.js', expected: 'components.Pagination' },
				{ input: 'test/src/js/components/LoadingIndicator.js', expected: 'components.LoadingIndicator' },
				{ input: 'test/src/js/components/UserProfile.js', expected: 'components.UserProfile' },
				{ input: 'test/src/js/ui/Button.js', expected: 'ui.Button' },
				{ input: 'test/src/js/forms/InputField.js', expected: 'forms.InputField' }
			];

			testCases.forEach(({ input, expected }) => {
				const result = generateCamelCaseObjectPath(input, 'test/src/js');
				assert.strictEqual(result, expected, `Failed for input: ${input}`);
			});
		});

		it('should handle non-React component names normally', function() {
			const testCases = [
				{ input: 'test/src/js/utils/date-helper.js', expected: 'utils.dateHelper' },
				{ input: 'test/src/js/services/api-client.js', expected: 'services.apiClient' },
				{ input: 'test/src/js/constants/app-config.js', expected: 'constants.appConfig' }
			];

			testCases.forEach(({ input, expected }) => {
				const result = generateCamelCaseObjectPath(input, 'test/src/js');
				assert.strictEqual(result, expected, `Failed for input: ${input}`);
			});
		});
	});
});
