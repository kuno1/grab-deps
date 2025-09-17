/*!
 * Modal Component for Assets Test
 *
 * @version 1.2.0
 * @handle assets-modal
 */

export const Modal = {
    isOpen: false,

    open() {
        this.isOpen = true;
        document.body.classList.add('modal-open');
    },

    close() {
        this.isOpen = false;
        document.body.classList.remove('modal-open');
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    }
};

export const ModalManager = {
    activeModals: new Set(),

    register(modal) {
        this.activeModals.add(modal);
    },

    closeAll() {
        this.activeModals.forEach(modal => modal.close());
        this.activeModals.clear();
    }
};

export function createModal(options = {}) {
    return {
        ...Modal,
        title: options.title || 'Modal',
        content: options.content || ''
    };
}
