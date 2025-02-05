/*!
 *  Test Build Block
 *
 * @handle my-test-blcok
 * @deps wp-blocks, wp-element, wp-api-fetch, wp-i18n
 */

const { useState } = wp.element;
const { __ } = wp.i18n;

const MyBubtton = ( props ) => {
	const loading = useState( false );
	return (
		<button onClick={ props.onClick() } className={ props.className }>
			{ loading ? __( 'Loading...' ) : __( 'Click Me' ) }
		</button>
	);
}
