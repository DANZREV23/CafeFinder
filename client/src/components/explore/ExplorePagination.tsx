import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";

interface ExplorePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ExplorePagination: React.FC<ExplorePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end === totalPages) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
            currentPage === i
              ? "bg-brand-coffee text-white shadow-md shadow-brand-coffee/20"
              : "bg-white text-brand-muted border border-brand-border hover:border-brand-coffee hover:text-brand-coffee"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-12">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-10 h-10 border-brand-border"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="hidden sm:flex items-center gap-2">
        {renderPageNumbers()}
      </div>

      <div className="flex sm:hidden items-center px-4 text-sm font-bold text-brand-charcoal">
        {currentPage} <span className="mx-1 text-brand-muted font-medium">of</span> {totalPages}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-10 h-10 border-brand-border"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
};
