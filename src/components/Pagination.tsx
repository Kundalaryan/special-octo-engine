import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 0) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
      <span className="text-sm text-gray-500">
        Page {currentPage + 1} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={currentPage === 0}
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          disabled={currentPage === totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};