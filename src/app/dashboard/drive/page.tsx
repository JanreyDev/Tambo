"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  HardDrive,
  Upload,
  FolderPlus,
  FolderOpen,
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
  Download,
  Trash2,
  Eye,
  Edit,
  Check,
  Bot,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { MabiniButton } from '@/components/ui/mabini-button';

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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [viewItem, setViewItem] = useState<DriveItem | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [uploadForm, setUploadForm] = useState({ folder: "/", description: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Toast system
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

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
            <button onClick={() => { setFolderName(""); setFormErrors({}); setShowNewFolder(true); }} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><FolderPlus className="h-4 w-4" /> New Folder</button>
            <button onClick={() => { setUploadForm({ folder: "/", description: "" }); setUploadFile(null); setFormErrors({}); setShowUpload(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Upload className="h-4 w-4" /> Upload</button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Storage Summary</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Storage at 25% capacity. 3 files haven&apos;t been accessed in over 90 days. Consider archiving old reports to free up space. No duplicate files detected.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      {/* Storage Bar */}
      <div className="p-4 rounded-xl glass">
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
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
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
          {folders.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Folders</p>
              <div className="rounded-xl glass overflow-hidden">
                {folders.map((f, i) => (
                  <div key={f.id} className={cn("flex items-center justify-between px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors", i < folders.length - 1 && "border-b border-border")}>
                    <div className="flex items-center gap-3">
                      {fileIcon(f.type)}
                      <div>
                        <p className="text-sm font-medium text-foreground">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground">{f.items_count} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{f.modified_at}</span>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setActionMenu(actionMenu === f.id ? null : f.id)} className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                        {actionMenu === f.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                            <button onClick={() => { setRenameName(f.name); setViewItem(f); setFormErrors({}); setShowRename(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Rename</button>
                            <button onClick={() => { setViewItem(f); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Files</p>
              <div className="rounded-xl glass overflow-hidden">
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
                      <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewItem(f)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {fileIcon(f.type)}
                            <span className="text-sm text-foreground">{f.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{f.size}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{f.modified_at}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{f.modified_by}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button onClick={() => setActionMenu(actionMenu === f.id ? null : f.id)} className="p-1 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                            {actionMenu === f.id && (
                              <div className="absolute right-0 top-8 z-20 w-44 glass rounded-lg shadow-lg py-1">
                                <button onClick={() => { setViewItem(f); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View Details</button>
                                <button onClick={() => setActionMenu(null)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Download className="h-3.5 w-3.5" /> Download</button>
                                <button onClick={() => { setRenameName(f.name); setViewItem(f); setFormErrors({}); setShowRename(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Rename</button>
                                <div className="border-t border-border my-1" />
                                <button onClick={() => { setViewItem(f); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                              </div>
                            )}
                          </div>
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
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {filtered.map((f) => (
            <div key={f.id} className="p-4 rounded-xl glass hover:shadow-md transition-all cursor-pointer text-center group relative"
              onClick={() => f.type !== "folder" && setViewItem(f)}>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setActionMenu(actionMenu === f.id ? null : f.id)} className="p-1 rounded hover:bg-muted"><MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" /></button>
                {actionMenu === f.id && (
                  <div className="absolute right-0 top-6 z-20 w-40 glass rounded-lg shadow-lg py-1">
                    <button onClick={() => { setRenameName(f.name); setViewItem(f); setFormErrors({}); setShowRename(true); setActionMenu(null); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted flex items-center gap-2"><Edit className="h-3 w-3" /> Rename</button>
                    {f.type !== "folder" && <button onClick={() => setActionMenu(null)} className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted flex items-center gap-2"><Download className="h-3 w-3" /> Download</button>}
                    <button onClick={() => { setViewItem(f); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                )}
              </div>
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
        <div className="p-12 text-center rounded-xl glass flex flex-col items-center gap-3">
          <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium text-foreground">This folder is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Upload files or create folders to organize your barangay documents.</p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Files" size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setShowUpload(false)}>Cancel</ModalButton><ModalButton variant="primary" onClick={() => { if (!uploadFile) { setFormErrors({ upload: "Please select a file to upload." }); return; } showToast("File Uploaded"); setShowUpload(false); }}>Upload</ModalButton></>}>
        <div className="space-y-4">
          <label className={cn("border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer block", formErrors.upload ? "border-red-500" : "border-border hover:border-muted-foreground/30")}>
            <input type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0] || null; setUploadFile(file); if (file) setFormErrors((prev) => { const { upload, ...rest } = prev; return rest; }); }} />
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            {uploadFile ? (
              <p className="text-sm font-medium text-foreground mb-1">{uploadFile.name}</p>
            ) : (
              <p className="text-sm font-medium text-foreground mb-1">Drop files here or click to browse</p>
            )}
            <p className="text-xs text-muted-foreground">Supports PDF, DOCX, XLSX, JPG, PNG up to 25MB each</p>
          </label>
          {formErrors.upload && <p className="text-xs text-red-500">{formErrors.upload}</p>}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Upload to Folder</label>
            <select value={uploadForm.folder} onChange={(e) => setUploadForm({ ...uploadForm, folder: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring">
              <option value="/">My Drive (Root)</option>
              <option value="/Barangay Ordinances">Barangay Ordinances</option>
              <option value="/Council Resolutions">Council Resolutions</option>
              <option value="/DILG Submissions">DILG Submissions</option>
              <option value="/Photos & Media">Photos & Media</option>
              <option value="/Templates">Templates</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Description (Optional)</label>
            <input type="text" value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Brief description of uploaded files"
              className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring" />
          </div>
        </div>
      </Modal>

      {/* New Folder Modal */}
      <Modal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="Create New Folder" size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => setShowNewFolder(false)}>Cancel</ModalButton><ModalButton variant="primary" onClick={() => { if (!folderName.trim()) { setFormErrors({ folderName: "Folder name is required." }); return; } showToast("Folder Created"); setShowNewFolder(false); }}>Create Folder</ModalButton></>}>
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Folder Name<span className="text-red-500 ml-0.5">*</span></label>
          <input type="text" value={folderName} onChange={(e) => { setFolderName(e.target.value); if (e.target.value.trim()) setFormErrors((prev) => { const { folderName, ...rest } = prev; return rest; }); }}
            placeholder="Enter folder name"
            className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", formErrors.folderName ? "border-red-500" : "border-border")} autoFocus />
          {formErrors.folderName && <p className="text-xs text-red-500 mt-1">{formErrors.folderName}</p>}
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal open={showRename} onClose={() => setShowRename(false)} title="Rename" size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => setShowRename(false)}>Cancel</ModalButton><ModalButton variant="primary" onClick={() => { if (!renameName.trim()) { setFormErrors({ renameName: "New name is required." }); return; } showToast("Item Renamed"); setShowRename(false); setViewItem(null); }}><Check className="h-4 w-4 mr-1" />Rename</ModalButton></>}>
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">New Name<span className="text-red-500 ml-0.5">*</span></label>
          <input type="text" value={renameName} onChange={(e) => { setRenameName(e.target.value); if (e.target.value.trim()) setFormErrors((prev) => { const { renameName, ...rest } = prev; return rest; }); }}
            className={cn("w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring", formErrors.renameName ? "border-red-500" : "border-border")} autoFocus />
          {formErrors.renameName && <p className="text-xs text-red-500 mt-1">{formErrors.renameName}</p>}
        </div>
      </Modal>

      {/* File Details Modal */}
      <Modal open={!!viewItem && !showDelete && !showRename} onClose={() => setViewItem(null)} title={viewItem?.name || ""} size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setViewItem(null)}>Close</ModalButton>{viewItem?.type !== "folder" && <ModalButton variant="primary"><Download className="h-4 w-4 mr-1" />Download</ModalButton>}</>}>
        {viewItem && viewItem.type !== "folder" && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg glass-subtle flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-background">{fileIcon(viewItem.type)}</div>
              <div>
                <p className="text-sm font-medium text-foreground">{viewItem.name}</p>
                <p className="text-xs text-muted-foreground">{viewItem.type.toUpperCase()} File</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[11px] text-muted-foreground uppercase">Size</p><p className="text-sm font-medium">{viewItem.size}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Type</p><p className="text-sm font-medium capitalize">{viewItem.type}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Modified</p><p className="text-sm font-medium">{viewItem.modified_at}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Modified By</p><p className="text-sm font-medium">{viewItem.modified_by}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Location</p><p className="text-sm font-medium">{viewItem.folder_path === "/" ? "My Drive" : viewItem.folder_path}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title={`Delete ${viewItem?.type === "folder" ? "Folder" : "File"}`} description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setViewItem(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { showToast("Item Deleted"); setShowDelete(false); setViewItem(null); }}>Delete &quot;{viewItem?.name}&quot;</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete <span className="font-medium text-foreground">&quot;{viewItem?.name}&quot;</span>?{viewItem?.type === "folder" && ` This folder contains ${viewItem?.items_count || 0} items that will also be permanently deleted.`}</p>
      </Modal>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-foreground text-background text-sm font-medium shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t.message}
          </div>
        ))}
      </div>
      <MabiniButton pageContext="You are on the Barangay Drive page. This page manages uploaded files, documents, and barangay records storage." />
    </div>
  );
}
