#!/usr/bin/env node

/*!
 * Image optimization
 */
import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminSvgo from 'imagemin-svgo';
import { stat } from 'fs/promises';

const [ , , src, dest ] = process.argv;

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
