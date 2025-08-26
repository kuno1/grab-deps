/*!
 * List component
 * @version 1.0.0
 */

const Item = (props) => {
    return `<li>${props.text}</li>`;
};

const List = (items) => {
    return `<ul>${items.map(Item).join('')}</ul>`;
};

export default List;
