"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  maxVisiblePages?: number;
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  maxVisiblePages = 5,
}: CustomPaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages: (number | string)[] = [];
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="outline"
        className="h-8 w-8 p-0"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <span className="sr-only">Go to previous page</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1 sm:gap-2">
        {getVisiblePages().map((page, index) => {
          if (page === "...") {
            return (
              <Button
                key={`ellipsis-${index}`}
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-transparent cursor-default"
                disabled
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              className="h-8 w-8 min-w-8 p-0 text-xs sm:text-sm"
              onClick={() => onPageChange(page as number)}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        className="h-8 w-8 p-0"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <span className="sr-only">Go to next page</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
