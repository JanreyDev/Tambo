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
  const centered = className?.includes("text-center");
  return (
    <th
      className={`px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors ${className || "text-left"}`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${centered ? "justify-center" : ""}`}>
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
