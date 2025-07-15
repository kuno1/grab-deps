/*!
 * List component
 * @version 1.0.0
 */

const item = (props) => {
    return `<li>${props.text}</li>`;
};

const list = (items) => {
    return `<ul>${items.map(item).join('')}</ul>`;
};

export default list;
