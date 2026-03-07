"use client";

import { useState } from "react";
import {
  HardDrive,
  Upload,
  FolderPlus,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  Folder,
  FileText,
  ImageIcon,
  File,
  FileSpreadsheet,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

interface DriveItem {
  id: string;
  name: string;
  type: "folder" | "document" | "image" | "spreadsheet" | "pdf" | "other";
  size: string;
  modified_at: string;
  modified_by: string;
  folder_path: string;
  items_count?: number;
}

const mockFiles: DriveItem[] = [
  { id: "1", name: "Barangay Ordinances", type: "folder", size: "", modified_at: "2026-03-05", modified_by: "Secretary Santos", folder_path: "/", items_count: 12 },
  { id: "2", name: "Council Resolutions", type: "folder", size: "", modified_at: "2026-03-01", modified_by: "Secretary Santos", folder_path: "/", items_count: 8 },
  { id: "3", name: "DILG Submissions", type: "folder", size: "", modified_at: "2026-02-28", modified_by: "Kag. Lopez", folder_path: "/", items_count: 15 },
  { id: "4", name: "Photos & Media", type: "folder", size: "", modified_at: "2026-03-06", modified_by: "Secretary Santos", folder_path: "/", items_count: 45 },
  { id: "5", name: "Templates", type: "folder", size: "", modified_at: "2026-01-15", modified_by: "Secretary Santos", folder_path: "/", items_count: 20 },
  { id: "6", name: "Barangay Development Plan 2026.pdf", type: "pdf", size: "2.4 MB", modified_at: "2026-03-03", modified_by: "Kag. Lopez", folder_path: "/" },
  { id: "7", name: "Annual Budget FY2026.xlsx", type: "spreadsheet", size: "850 KB", modified_at: "2026-02-20", modified_by: "Treasurer Reyes", folder_path: "/" },
  { id: "8", name: "SK Activity Report Q1.docx", type: "document", size: "1.1 MB", modified_at: "2026-03-06", modified_by: "SK Chair Pascual", folder_path: "/" },
  { id: "9", name: "Barangay Hall Photo.jpg", type: "image", size: "3.2 MB", modified_at: "2026-03-01", modified_by: "Secretary Santos", folder_path: "/" },
  { id: "10", name: "Meeting Minutes - March 2026.docx", type: "document", size: "520 KB", modified_at: "2026-03-06", modified_by: "Secretary Santos", folder_path: "/" },
];

export default function DrivePage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const filtered = mockFiles.filter((f) => {
    if (search) return f.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const folders = filtered.filter((f) => f.type === "folder");
  const files = filtered.filter((f) => f.type !== "folder");

  const totalSize = "12.8 GB";
  const usedSize = "3.2 GB";

  const fileIcon = (type: string) => {
    switch (type) {
      case "folder": return <Folder className="h-5 w-5 text-amber-500" />;
      case "document": return <FileText className="h-5 w-5 text-blue-500" />;
      case "image": return <ImageIcon className="h-5 w-5 text-purple-500" />;
      case "spreadsheet": return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
      case "pdf": return <File className="h-5 w-5 text-red-500" />;
      default: return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drive"
        description="Barangay cloud file storage"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tools" }, { label: "Drive" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><FolderPlus className="h-4 w-4" /> New Folder</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Upload className="h-4 w-4" /> Upload</button>
          </div>
        }
      />

      {/* Storage Bar */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-foreground font-medium">Storage Used</p>
          <p className="text-sm text-muted-foreground">{usedSize} of {totalSize}</p>
        </div>
        <div className="w-full h-2 rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: "25%", background: "var(--accent-primary)" }} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg border border-border">
          <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded", viewMode === "list" ? "bg-muted" : "hover:bg-muted/50")}><List className="h-4 w-4" /></button>
          <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded", viewMode === "grid" ? "bg-muted" : "hover:bg-muted/50")}><Grid3X3 className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Breadcrumb Path */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <HardDrive className="h-4 w-4" />
        <span className="font-medium text-foreground">My Drive</span>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Folders</p>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {folders.map((f, i) => (
                  <div key={f.id} className={cn("flex items-center justify-between px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors", i < folders.length - 1 && "border-b border-border")}>
                    <div className="flex items-center gap-3">
                      {fileIcon(f.type)}
                      <div>
                        <p className="text-sm font-medium text-foreground">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground">{f.items_count} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{f.modified_at}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Files</p>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Modified</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">By</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f) => (
                      <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {fileIcon(f.type)}
                            <span className="text-sm text-foreground">{f.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{f.size}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{f.modified_at}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{f.modified_by}</td>
                        <td className="px-4 py-3">
                          <button className="p-1 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {filtered.map((f) => (
            <div key={f.id} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer text-center group">
              <div className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center bg-muted/50">
                {fileIcon(f.type)}
              </div>
              <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{f.type === "folder" ? `${f.items_count} items` : f.size}</p>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="p-12 text-center text-muted-foreground rounded-xl border border-border bg-card">No files or folders found.</div>
      )}
    </div>
  );
}
