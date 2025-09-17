const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

/**
 * Custom webpack configuration that extends @wordpress/scripts
 * Adds namespace transformation loader to process ES modules in memory
 *
 * Usage in your project's webpack.config.js:
 *   const grabDepsConfig = require('@kunoichi/grab-deps/webpack.config.js');
 *   module.exports = grabDepsConfig;
 *
 * Or to extend existing configuration:
 *   const grabDepsConfig = require('@kunoichi/grab-deps/webpack.config.js');
 *   module.exports = { ...grabDepsConfig, ...yourCustomConfig };
 */

/**
 * Create grab-deps webpack configuration
 * @param {object} baseConfig - Base webpack configuration (defaults to @wordpress/scripts config)
 * @returns {object|object[]} - Modified webpack configuration
 */
function createGrabDepsConfig(baseConfig = defaultConfig) {
	// If the config is an array (multiple configurations), we need to handle both
	const configs = Array.isArray(baseConfig) ? baseConfig : [baseConfig];

	const modifiedConfigs = configs.map(config => ({
		...config,
		resolve: {
			...config.resolve,
			alias: {
				...config.resolve?.alias,
			},
		},
		module: {
			...config.module,
			rules: [
				// Add our custom loader before other loaders (including minification)
				{
					test: /\.m?(j|t)sx?$/,
					exclude: /node_modules/,
					use: [
						{
							loader: path.resolve(__dirname, 'lib/webpack-loaders/namespace-transform-loader.js'),
						},
					],
					enforce: 'pre', // Run before other loaders
				},
				// Include all existing rules
				...config.module.rules,
			],
		},
	}));

	return modifiedConfigs.length === 1 ? modifiedConfigs[0] : modifiedConfigs;
}

// Export the default configuration
module.exports = createGrabDepsConfig();
