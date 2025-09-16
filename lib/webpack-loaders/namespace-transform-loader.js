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
			config = readGrabDepsConfig();
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
				// Generate camelCase object path: js/components/test-es6-module.js -> components.testEs6Module
				const { generateCamelCaseObjectPath } = require('../file-utils');
				const camelCaseObjectPath = generateCamelCaseObjectPath(resourcePath, config.srcDir);
				const globalPath = `window.${config.namespace}.${camelCaseObjectPath}`;

				// Create namespace initialization code
				let initCode = `window.${config.namespace} = window.${config.namespace} || {};\n`;
				const parts = camelCaseObjectPath.split('.');
				let currentPath = `window.${config.namespace}`;
				for (let i = 0; i < parts.length; i++) {
					currentPath += `.${parts[i]}`;
					initCode += `${currentPath} = ${currentPath} || {};\n`;
				}

				// Convert export statements to const declarations and register to global
				exports.named.forEach((exportName) => {
					const exportRegex = new RegExp(`export\\s+const\\s+${exportName}\\s*=`, 'g');
					transformedSource = transformedSource.replace(exportRegex, `const ${exportName} =`);
				});

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
