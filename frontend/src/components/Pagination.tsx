import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-neutral-200 px-1 py-3">
      <p className="text-xs text-neutral-500">
        Page {page} / {totalPages} — {total} résultat{total > 1 ? "s" : ""}
      </p>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          type="button"
        >
          <ChevronLeft className="size-4" />
          Précédent
        </Button>
        <Button
          variant="ghost"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          type="button"
        >
          Suivant
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
