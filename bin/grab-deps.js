#!/usr/bin/env node
const { dumpSetting, compileDirectory } = require( '../index.js' );

const [ , , subcommand ] = process.argv;

// Subcommands.
switch ( subcommand ) {
	case 'dump':
		{
			const args = process.argv.slice( 3 );
			let dir = './src';
			let json = './wp-dependencies.json';
			let suffix = '';
			let version = '0.0.0';
			let configPath = null;

			// Parse arguments
			for ( let i = 0; i < args.length; i++ ) {
				const arg = args[ i ];
				if ( arg === '--config' ) {
					configPath = args[ i + 1 ];
					i++; // Skip next argument as it's the config path
				} else if ( i === 0 ) {
					dir = arg;
				} else if ( i === 1 ) {
					json = arg;
				} else if ( i === 2 ) {
					suffix = arg;
				} else if ( i === 3 ) {
					version = arg;
				}
			}

			// eslint-disable-next-line no-console
			console.log( `Scanning ${ dir } and dumping ${ json }` );
			dumpSetting( dir, json, suffix, version, configPath );
		}
		break;
	case 'js':
		{
			const args = process.argv.slice( 3 );
			let srcDir = './src/js';
			let destDir = './build/js';
			let extension = 'js,jsx';
			let configPath = null;

			// Parse arguments
			for ( let i = 0; i < args.length; i++ ) {
				const arg = args[ i ];
				if ( arg === '--config' ) {
					configPath = args[ i + 1 ];
					i++; // Skip next argument as it's the config path
				} else if ( i === 0 ) {
					srcDir = arg;
				} else if ( i === 1 ) {
					destDir = arg;
				} else if ( i === 2 ) {
					extension = arg;
				}
			}

			extension = extension.split( ',' );
			compileDirectory( srcDir, destDir, extension, configPath )
				.then( () => {
					// eslint-disable-next-line no-console
					console.log( 'Compiled JavaScripts.' );
				} )
				// eslint-disable-next-line no-console
				.catch( console.error );
		}
		break;
	default:
		// eslint-disable-next-line no-console
		console.error( 'No subcommand available: %s', subcommand );
		break;
}
