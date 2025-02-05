#!/usr/bin/env node
const { dumpSetting, compileDirectory } = require( '../index.js' );

const [ node, js, subcommand ] = process.argv;

// Subcommands.
switch ( subcommand ) {
	case 'dump':
		dir  = process.argv[ 3 ] || './src';
		json = process.argv[ 4 ] || './wp-dependencies.json';
		suffix = process.argv[ 5 ] || '';
		version = process.argv[ 6 ] || '0.0.0';
		console.log( `Scanning ${dir} and dumping ${json}` );
		dumpSetting( dir, json, suffix, version );
		break;
	case 'js':
		srcDir = process.argv[ 3 ] || './src/js';
		destDir = process.argv[ 4 ] || './build/js';
		extention = process.argv[ 5 ] || 'js,jsx';
		extention = extention.split( ',' );
		compileDirectory( srcDir, destDir, extention ).then( ( res ) => {
			console.log( 'Compiled JavaScripts.' );
		} ).catch( console.error );
		break;
	default:
		console.error( 'No subcommand available: %s', subcommand );
		break;
}
