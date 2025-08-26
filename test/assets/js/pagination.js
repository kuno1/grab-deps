/**
 * Pagination component for test/assets
 * This file should have namespace applied when srcDir is correctly configured
 */

function pagination() {
    return {
        currentPage: 1,
        totalPages: 5,
        itemsPerPage: 10,
        navigate: function(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
            }
        },
        getDisplayText: function() {
            return 'Page ' + this.currentPage + ' of ' + this.totalPages;
        }
    };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pagination;
}
