const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

/**
 * Custom webpack configuration that extends @wordpress/scripts
 * Adds namespace transformation loader to process ES modules in memory
 */

// If the default config is an array (multiple configurations), we need to handle both
const configs = Array.isArray(defaultConfig) ? defaultConfig : [defaultConfig];

const modifiedConfigs = configs.map(config => ({
	...config,
	resolve: {
		...config.resolve,
		alias: {
			...config.resolve?.alias,
			// Test-only alias for namespace import resolution
			// This allows webpack to resolve @testns imports before namespace-transform-loader processes them
			'@testns': path.resolve(__dirname, 'test/src'),
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

// Export the modified configuration(s)
module.exports = modifiedConfigs.length === 1 ? modifiedConfigs[0] : modifiedConfigs;
