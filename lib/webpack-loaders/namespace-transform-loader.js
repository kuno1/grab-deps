const { readGrabDepsConfig } = require('../config');
const { parseExports } = require('../parsers');
const { generateGlobalRegistration } = require('../generators');
const path = require('path');

/**
 * Webpack loader to transform namespace imports and exports
 * This loader processes JavaScript files in memory without touching the filesystem
 */
module.exports = function namespaceTansformLoader(source) {
	const callback = this.async();
	const resourcePath = this.resourcePath;

	// console.log('[namespace-transform-loader] Processing:', resourcePath);

	try {
		// Load grab-deps configuration
		// First try to find .grab-deps.json (more specific configuration)
		let config = {};
		const fs = require('fs');
		const path = require('path');

		// Look for .grab-deps.json in the directory of the file being processed and parents
		let searchDir = path.dirname(resourcePath);

		while (searchDir !== path.dirname(searchDir)) {
			const configPath = path.join(searchDir, '.grab-deps.json');
			if (fs.existsSync(configPath)) {
				config = readGrabDepsConfig(configPath);
				break;
			}
			searchDir = path.dirname(searchDir);
		}

		// If no .grab-deps.json found, fall back to package.json
		if (Object.keys(config).length === 0) {
			config = readGrabDepsConfig(null, 'js'); // Load JS-specific config
		}

		// Skip transformation if config is not set up for ES modules
		if (!config.globalExportGeneration || !config.namespace || !config.srcDir) {
			return callback(null, source);
		}

		// Check if file is within the configured source directory
		const srcDirPath = path.resolve(config.srcDir);
		const filePath = path.resolve(resourcePath);

		if (!filePath.startsWith(srcDirPath)) {
			return callback(null, source);
		}

		let transformedSource = source;

		// Transform exports to global registration
		if (config.globalExportGeneration) {
			const exports = parseExports(source);

			if (exports.named.length > 0) {
				// Generate camelCase directory path only (exclude filename): js/components/test-es6-module.js -> components
				const { generateCamelCaseObjectPath } = require('../file-utils');
				const relativePath = path.relative(path.resolve(config.srcDir), resourcePath);
				const dirPath = path.dirname(relativePath);

				// Only use directory path for namespace, not the filename
				let camelCaseObjectPath;
				if (dirPath === '.') {
					// File is in root of srcDir, use namespace directly
					camelCaseObjectPath = '';
				} else {
					camelCaseObjectPath = generateCamelCaseObjectPath(dirPath + '/dummy.js', '.').replace('.dummy', '');
				}

				const globalPath = camelCaseObjectPath ? `globalThis.${config.namespace}.${camelCaseObjectPath}` : `globalThis.${config.namespace}`;

				// Create namespace initialization code
				let initCode = `globalThis.${config.namespace} = globalThis.${config.namespace} || {};\n`;

				// Only create nested namespace if we have a directory path
				if (camelCaseObjectPath) {
					const parts = camelCaseObjectPath.split('.');
					let currentPath = `globalThis.${config.namespace}`;
					for (let i = 0; i < parts.length; i++) {
						currentPath += `.${parts[i]}`;
						initCode += `${currentPath} = ${currentPath} || {};\n`;
					}
				}

				// Convert ALL export statements to const declarations
				// Handle "export const", "export function", "export let", "export var"
				transformedSource = transformedSource
					.replace(/export\s+const\s+/g, 'const ')
					.replace(/export\s+let\s+/g, 'let ')
					.replace(/export\s+var\s+/g, 'var ')
					.replace(/export\s+function\s+/g, 'function ')
					.replace(/export\s+class\s+/g, 'class ');

				// Remove any remaining export statements
				transformedSource = transformedSource.replace(/export\s*\{[^}]*\}\s*;?\s*/g, '');

				// Add namespace initialization and named exports registration
				const namedExportsCode = exports.named.map(exportName =>
					`\t${exportName}: ${exportName}`
				).join(',\n');

				transformedSource += `\n\n${initCode}${globalPath} = Object.assign(${globalPath}, {\n${namedExportsCode}\n});`;
			}
		}

		callback(null, transformedSource);

	} catch (error) {
		// If transformation fails, return original source
		console.warn(`[grab-deps] Warning: Failed to transform ${resourcePath}:`, error.message);
		callback(null, source);
	}
};
