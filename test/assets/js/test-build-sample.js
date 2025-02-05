/*!
 * Sample JavaScript File
 *
 * @deps jquery
 * @strategy defer
 * @version 2.0.0
 */


const $ = jQuery;

$( document ).ready( function() {

	$( '.button' ).click( function( e ) {
		e.preventDefault();
		alert( 'Clicked!' );
	} );
} );
