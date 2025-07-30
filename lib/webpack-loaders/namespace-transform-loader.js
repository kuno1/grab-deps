const { readGrabDepsConfig } = require('../config');
const { parseExports, parseNamespaceImports } = require('../parsers');
const { convertNamespaceImportToHandle, generateGlobalRegistration } = require('../generators');
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

		// Transform namespace imports
		if (config.autoImportDetection) {
			const namespaceImports = parseNamespaceImports(source, config.namespace);

			namespaceImports.forEach((importPath) => {
				const importHandle = convertNamespaceImportToHandle(importPath, config.namespace);
				if (importHandle) {
					// Convert namespace import to global variable access
					const namespacePattern = new RegExp(
						`import\\s+{([^}]+)}\\s+from\\s+['"]@${config.namespace}/${importPath.replace(config.namespace + '/', '')}['"]`,
						'g'
					);

					transformedSource = transformedSource.replace(namespacePattern, (match, imports) => {
						const importNames = imports.split(',').map(name => name.trim());
						const globalPath = importPath.replace('@' + config.namespace + '/', '').split('/');
						const globalAccess = `window.${config.namespace}.${globalPath.join('.')}`;

						return importNames.map(name => {
							const cleanName = name.replace(/\s+as\s+\w+/, '').trim();
							return `const ${name} = ${globalAccess}.${cleanName};`;
						}).join('\n');
					});
				}
			});
		}

		// Transform exports to global registration
		if (config.globalExportGeneration) {
			const exports = parseExports(source);

			if (exports.named.length > 0 || exports.default) {
				// Convert export statements to const declarations
				exports.named.forEach((exportName) => {
					const exportRegex = new RegExp(`export\\s+const\\s+${exportName}\\s*=`, 'g');
					transformedSource = transformedSource.replace(exportRegex, `const ${exportName} =`);
				});

				// Convert default export
				if (exports.default) {
					transformedSource = transformedSource.replace(
						/export\s+default\s+/,
						'const defaultExport = '
					);
				}

				// Generate and append global registration code
				const globalCode = generateGlobalRegistration(
					resourcePath,
					config.srcDir,
					config.namespace,
					exports
				);

				transformedSource += '\n\n' + globalCode;
			}
		}

		callback(null, transformedSource);

	} catch (error) {
		// If transformation fails, return original source
		console.warn(`[grab-deps] Warning: Failed to transform ${resourcePath}:`, error.message);
		callback(null, source);
	}
};
