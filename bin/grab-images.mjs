#!/usr/bin/env node

/*!
 * Image optimization
 */
import imagemin from 'imagemin';
import imageminJpegtran from "imagemin-jpegtran";
import imageminPngquant from "imagemin-pngquant";
import imageminGifsicle from "imagemin-gifsicle";
import imageminSvgo from "imagemin-svgo";
import { stat } from 'fs/promises'

const [ node, js, src, dest ] = process.argv;

/**
 * Get file size of image.
 *
 * @param filePath
 * @returns {Promise<number>}
 */
async function getFileSize(filePath) {
	const stats = await stat(filePath);
	return stats.size;
}

/**
 * Calculate compression rate.
 *
 * @param sourceFilePath
 * @param destinationFilePath
 * @returns {Promise<string>}
 */
async function calculateCompressionRate(sourceFilePath, destinationFilePath) {
	const originalSize = await getFileSize(sourceFilePath);
	const compressedSize = await getFileSize(destinationFilePath);

	const reduction = ((originalSize - compressedSize) / originalSize) * 100;
	return reduction.toFixed(2);
}

// Optimize images.
imagemin( [ src ], {
	destination: dest,
	plugins: [
		imageminJpegtran(),
		imageminPngquant( { quality: [ 0.65, 0.8 ] } ),
		imageminGifsicle(),
		imageminSvgo()
	]
} ).then( ( files ) => {
	console.log( '%d images optimized', files.length );
	files.map( file => {
		calculateCompressionRate( file.sourcePath, file.destinationPath ).then( ( reduced_size ) => {
			console.log( '%s -> %s(%d%%)', file.sourcePath, file.destinationPath, reduced_size );
		} );
	} );
} );
