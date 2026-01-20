import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 0) return null;

  // Helper to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // e.g., 1 ... 4 5 6 ... 10

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      // Always show first, last, and pages around current
      const start = Math.max(0, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 0) {
        pages.push(0);
        if (start > 1) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        if (end < totalPages - 2) pages.push('...');
        pages.push(totalPages - 1);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
      <div className="hidden sm:flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          Page {currentPage + 1} of {totalPages}
        </span>
        <span className="text-xs text-gray-500 mt-0.5">
          Showing results for current filters
        </span>
      </div>

      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
        <button
          disabled={currentPage === 0}
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          className="p-2 mr-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500 hover:text-gray-900"
          aria-label="Previous Page"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-1.5">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-gray-400">
                  <MoreHorizontal size={16} />
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = currentPage === pageNum;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 transform scale-105'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>

        <button
          disabled={currentPage === totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          className="p-2 ml-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500 hover:text-gray-900"
          aria-label="Next Page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};