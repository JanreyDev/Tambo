"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { MabiniButton } from "@/components/ui/mabini-button";
import { Modal, ModalButton } from "@/components/ui/modal";
import { api } from "@/lib/api";
import {
  HardDrive, Upload, FolderPlus, FolderOpen, Search,
  File, FileText, FileImage, Download, Trash2,
  Share2, ChevronRight, Home, RefreshCw, MoreHorizontal,
  Image, Music, Video, Archive, X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

interface DriveFolder {
  id: string;
  name: string;
  color: string | null;
  is_shared_with_barangay: boolean;
  folder_count?: number;
  children?: DriveFolder[];
  created_at: string;
}

interface DriveFile {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  drive_shared_with_barangay: boolean;
  created_at: string;
}

interface DriveStats {
  total_size: number;
  file_count: number;
  folder_count: number;
  shared_with_me: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) return Archive;
  return File;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

const FOLDER_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

export default function DrivePage() {
  const [stats, setStats] = useState<DriveStats | null>(null);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DriveFolder | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [newFolderShared, setNewFolderShared] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get<DriveStats>("/drive/stats");
      setStats(data);
    } catch { /* non-critical */ }
  }, []);

  const fetchRoot = useCallback(async () => {
    setLoading(true);
    try {
      const [foldersData, filesData] = await Promise.all([
        api.get<{ folders: DriveFolder[] }>("/drive/folders"),
        api.get<{ files: DriveFile[] }>("/drive/files"),
      ]);
      setFolders((foldersData as { folders: DriveFolder[] }).folders ?? []);
      setFiles((filesData as { files: DriveFile[] }).files ?? []);
    } catch { /* non-critical */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchFolder = useCallback(async (folder: DriveFolder) => {
    setLoading(true);
    setCurrentFolder(folder);
    try {
      const data = await api.get<{ folder: DriveFolder & { children?: DriveFolder[] }; files: DriveFile[] }>(`/drive/folders/${folder.id}`);
      setFolders((data as { folder: DriveFolder & { children?: DriveFolder[] } }).folder?.children ?? []);
      setFiles((data as { files: DriveFile[] }).files ?? []);
    } catch { /* non-critical */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRoot();
  }, [fetchStats, fetchRoot]);

  const navigateToFolder = (folder: DriveFolder) => {
    setBreadcrumb(prev => [...prev, folder]);
    fetchFolder(folder);
  };
  const navigateBack = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index);
    setBreadcrumb(newBreadcrumb);
    if (newBreadcrumb.length === 0) {
      setCurrentFolder(null);
      fetchRoot();
    } else {
      const parent = newBreadcrumb[newBreadcrumb.length - 1];
      if (parent) {
        fetchFolder(parent);
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolder) formData.append("folder_id", currentFolder.id);
      await api.post("/drive/files", formData);
      if (currentFolder) fetchFolder(currentFolder);
      else fetchRoot();
      fetchStats();
    } catch { /* non-critical */ } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      await api.post("/drive/folders", {
        name: newFolderName.trim(),
        color: newFolderColor,
        is_shared_with_barangay: newFolderShared,
        parent_id: currentFolder?.id ?? null,
      });
      setShowNewFolder(false);
      setNewFolderName("");
      setNewFolderColor(FOLDER_COLORS[0]);
      setNewFolderShared(false);
      if (currentFolder) fetchFolder(currentFolder);
      else fetchRoot();
    } catch { /* non-critical */ } finally {
      setCreatingFolder(false);
    }
  };

  const downloadFile = async (file: DriveFile) => {
    try {
      const data = await api.get<{ url: string }>(`/drive/files/${file.id}/download`);
      window.open((data as { url: string }).url, "_blank");
    } catch { /* non-critical */ }
  };

  const deleteFile = async (file: DriveFile) => {
    try {
      await api.delete(`/drive/files/${file.id}`);
      setFiles(prev => prev.filter(f => f.id !== file.id));
      fetchStats();
    } catch { /* non-critical */ }
  };

  const deleteFolder = async (folder: DriveFolder) => {
    try {
      await api.delete(`/drive/folders/${folder.id}`);
      setFolders(prev => prev.filter(f => f.id !== folder.id));
    } catch { /* non-critical */ }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      if (val) {
        const data = await api.get<{ files: DriveFile[] }>(`/drive/files?search=${encodeURIComponent(val)}`);
        setFiles((data as { files: DriveFile[] }).files ?? []);
      } else {
        if (currentFolder) fetchFolder(currentFolder);
        else fetchRoot();
      }
    }, 400);
  };

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader
        title="Drive"
        description="Your personal file storage — upload, organize, and share documents"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Drive" }]}
        actions={
          <MabiniButton pageContext="You are on the Drive page. This is the personal file storage for barangay staff. Users can upload files, organize them into folders, and optionally share with the entire barangay team. Works like Dropbox." />
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Storage Used", value: formatBytes(stats.total_size), icon: HardDrive, color: "#3b82f6" },
            { label: "Files", value: stats.file_count.toString(), icon: File, color: "#10b981" },
            { label: "Folders", value: stats.folder_count.toString(), icon: FolderOpen, color: "#f59e0b" },
            { label: "Shared With Me", value: stats.shared_with_me.toString(), icon: Share2, color: "#8b5cf6" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}20` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            onClick={() => navigateBack(0)}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm ${!currentFolder ? "text-accent-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Home className="w-3.5 h-3.5" />
            My Drive
          </button>
          {breadcrumb.map((f, i) => (
            <div key={f.id} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              <button
                onClick={() => navigateBack(i + 1)}
                className={`text-sm transition-colors ${i === breadcrumb.length - 1 ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f.name}
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search files..."
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary w-44"
            />
          </div>
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Folder
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: "var(--accent-primary)" }}
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => { if (currentFolder) fetchFolder(currentFolder); else fetchRoot(); }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl border border-border animate-pulse">
                <div className="h-12 bg-muted rounded-lg mb-2" />
                <div className="h-2.5 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-1/2 mt-1" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="p-16 text-center">
            <HardDrive className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {currentFolder ? "This folder is empty" : "Your drive is empty"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">Upload files or create a folder to get started</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Folders */}
            {folders.map(folder => (
              <div
                key={folder.id}
                className="group relative p-3 rounded-xl border border-border hover:border-accent-primary/50 hover:bg-muted/30 transition-all cursor-pointer"
                onDoubleClick={() => navigateToFolder(folder)}
              >
                <button
                  onClick={() => navigateToFolder(folder)}
                  className="w-full text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: folder.color ? `${folder.color}20` : "#6366f120" }}
                  >
                    <FolderOpen className="w-5 h-5" style={{ color: folder.color ?? "#6366f1" }} />
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate">{folder.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {folder.folder_count ?? 0} items
                    {folder.is_shared_with_barangay && " · Shared"}
                  </p>
                </button>
                <button
                  onClick={() => deleteFolder(folder)}
                  className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Files */}
            {files.map(file => {
              const FileIcon = getFileIcon(file.mime_type);
              return (
                <div
                  key={file.id}
                  className="group relative p-3 rounded-xl border border-border hover:border-accent-primary/50 hover:bg-muted/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
                    <FileIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate" title={file.original_name}>
                    {file.original_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatBytes(file.size_bytes)} · {timeAgo(file.created_at)}
                    {file.drive_shared_with_barangay && " · Shared"}
                  </p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                    <button
                      onClick={() => downloadFile(file)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteFile(file)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                      title="Delete"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      <Modal
        open={showNewFolder}
        onClose={() => { setShowNewFolder(false); setNewFolderName(""); }}
        title="New Folder"
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowNewFolder(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={createFolder} disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder ? "Creating..." : "Create Folder"}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Folder Name *</label>
            <input
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="My Documents"
              autoFocus
              onKeyDown={e => e.key === "Enter" && createFolder()}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {FOLDER_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewFolderColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${newFolderColor === color ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newFolderShared}
              onChange={e => setNewFolderShared(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Share with all barangay staff</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
