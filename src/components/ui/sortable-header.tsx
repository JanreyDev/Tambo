import { ChevronUp, ChevronDown } from "lucide-react";

export function SortableHeader({
  label,
  field,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  field: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors ${className || ""}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === field &&
          (sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          ))}
      </div>
    </th>
  );
}
