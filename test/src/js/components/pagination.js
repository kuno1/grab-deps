/*!
 * Pagination component
 * @version 1.0.0
 */

export const CreatePagination = (currentPage, totalPages) => {
    return {
        current: currentPage,
        total: totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
    };
};

export const RenderPagination = (pagination) => {
    return `<div class="pagination">Page ${pagination.current} of ${pagination.total}</div>`;
};

const Pagination = (props) => {
    const paginationData = CreatePagination(props.currentPage, props.totalPages);
    return RenderPagination(paginationData);
};

export default Pagination;
