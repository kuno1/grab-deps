#!/usr/bin/env node

/*!
 * Image optimization
 */
import { stat } from 'fs/promises';

const [ , , src, dest ] = process.argv;

// imagemin packages are optional peer dependencies. Load them lazily.
let imagemin,
	imageminJpegtran,
	imageminPngquant,
	imageminGifsicle,
	imageminSvgo;
try {
	[
		{ default: imagemin },
		{ default: imageminJpegtran },
		{ default: imageminPngquant },
		{ default: imageminGifsicle },
		{ default: imageminSvgo },
	] = await Promise.all( [
		import( 'imagemin' ),
		// eslint-disable-next-line import/no-unresolved -- ESM-only "exports" is not resolved by eslint-plugin-import.
		import( 'imagemin-jpegtran' ),
		import( 'imagemin-pngquant' ),
		import( 'imagemin-gifsicle' ),
		import( 'imagemin-svgo' ),
	] );
} catch ( e ) {
	// eslint-disable-next-line no-console
	console.error(
		'grab-deps-image requires imagemin packages. Install them with:\n' +
			'  npm install --save-dev imagemin imagemin-gifsicle imagemin-jpegtran imagemin-pngquant imagemin-svgo\n\n' +
			e.message
	);
	process.exit( 1 );
}

/**
 * Get file size of image.
 *
 * @param {string} filePath - Path to the file
 * @return {Promise<number>} File size in bytes
 */
async function getFileSize( filePath ) {
	const stats = await stat( filePath );
	return stats.size;
}

/**
 * Calculate compression rate.
 *
 * @param {string} sourceFilePath      - Path to source file
 * @param {string} destinationFilePath - Path to destination file
 * @return {Promise<string>} Compression rate as percentage string
 */
async function calculateCompressionRate( sourceFilePath, destinationFilePath ) {
	const originalSize = await getFileSize( sourceFilePath );
	const compressedSize = await getFileSize( destinationFilePath );

	const reduction =
		( ( originalSize - compressedSize ) / originalSize ) * 100;
	return reduction.toFixed( 2 );
}

// Optimize images.
imagemin( [ src ], {
	destination: dest,
	plugins: [
		imageminJpegtran(),
		imageminPngquant( { quality: [ 0.65, 0.8 ] } ),
		imageminGifsicle(),
		imageminSvgo(),
	],
} ).then( ( files ) => {
	// eslint-disable-next-line no-console
	console.log( '%d images optimized', files.length );
	files.forEach( ( file ) => {
		calculateCompressionRate( file.sourcePath, file.destinationPath ).then(
			( reducedSize ) => {
				// eslint-disable-next-line no-console
				console.log(
					'%s -> %s(%d%%)',
					file.sourcePath,
					file.destinationPath,
					reducedSize
				);
			}
		);
	} );
} );
