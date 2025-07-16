#!/usr/bin/env node
const { dumpSetting, compileDirectory } = require( '../index.js' );

const [ , , subcommand ] = process.argv;

// Subcommands.
switch ( subcommand ) {
	case 'dump':
		{
			const dir = process.argv[ 3 ] || './src';
			const json = process.argv[ 4 ] || './wp-dependencies.json';
			const suffix = process.argv[ 5 ] || '';
			const version = process.argv[ 6 ] || '0.0.0';
			// eslint-disable-next-line no-console
			console.log( `Scanning ${ dir } and dumping ${ json }` );
			dumpSetting( dir, json, suffix, version );
		}
		break;
	case 'js':
		{
			const srcDir = process.argv[ 3 ] || './src/js';
			const destDir = process.argv[ 4 ] || './build/js';
			let extension = process.argv[ 5 ] || 'js,jsx';
			extension = extension.split( ',' );
			compileDirectory( srcDir, destDir, extension )
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
