/*!
 * Button Component for Assets Test
 *
 * @version 2.0.0
 */

export const Button = {
    render(text, className = 'btn') {
        return `<button class="${className}">${text}</button>`;
    },

    handleClick(callback) {
        return function(event) {
            event.preventDefault();
            if (typeof callback === 'function') {
                callback(event);
            }
        };
    }
};

export const PrimaryButton = {
    ...Button,
    render(text) {
        return Button.render(text, 'btn btn-primary');
    }
};

export function createButton(config) {
    return {
        text: config.text || 'Button',
        onClick: config.onClick || (() => {}),
        render() {
            return Button.render(this.text, config.className);
        }
    };
}
