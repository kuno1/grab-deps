/*!
 * Pagination component
 * @version 1.0.0
 */

export const createPagination = (currentPage, totalPages) => {
    return {
        current: currentPage,
        total: totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
    };
};

export const renderPagination = (pagination) => {
    return `<div class="pagination">Page ${pagination.current} of ${pagination.total}</div>`;
};
