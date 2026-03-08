"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  Download,
  AlertTriangle,
  Archive,
  Tag,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Bot,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  min_stock: number;
  location: string;
  condition: string;
  acquired_date: string;
  acquisition_cost: number;
  last_checked: string;
}

const mockItems: InventoryItem[] = [
  { id: "1", item_name: "Office Chair (Swivel)", category: "Furniture", quantity: 8, unit: "pcs", min_stock: 5, location: "Barangay Hall - Main Office", condition: "good", acquired_date: "2024-06-15", acquisition_cost: 3500, last_checked: "2026-03-01" },
  { id: "2", item_name: "Desktop Computer (Core i5)", category: "IT Equipment", quantity: 3, unit: "units", min_stock: 3, location: "Barangay Hall - Main Office", condition: "good", acquired_date: "2025-01-10", acquisition_cost: 35000, last_checked: "2026-03-01" },
  { id: "3", item_name: "Printer (Epson L3210)", category: "IT Equipment", quantity: 2, unit: "units", min_stock: 1, location: "Barangay Hall - Main Office", condition: "good", acquired_date: "2025-03-20", acquisition_cost: 8500, last_checked: "2026-03-01" },
  { id: "4", item_name: "Bond Paper A4 (Ream)", category: "Office Supplies", quantity: 15, unit: "reams", min_stock: 10, location: "Storage Room", condition: "good", acquired_date: "2026-02-28", acquisition_cost: 220, last_checked: "2026-03-05" },
  { id: "5", item_name: "Printer Ink (Black)", category: "Office Supplies", quantity: 2, unit: "bottles", min_stock: 3, location: "Storage Room", condition: "good", acquired_date: "2026-02-28", acquisition_cost: 350, last_checked: "2026-03-05" },
  { id: "6", item_name: "Folding Table (6ft)", category: "Furniture", quantity: 10, unit: "pcs", min_stock: 5, location: "Multi-Purpose Hall", condition: "fair", acquired_date: "2022-08-10", acquisition_cost: 2800, last_checked: "2026-02-15" },
  { id: "7", item_name: "Megaphone", category: "Equipment", quantity: 2, unit: "pcs", min_stock: 1, location: "Tanod Office", condition: "good", acquired_date: "2024-01-05", acquisition_cost: 1500, last_checked: "2026-03-01" },
  { id: "8", item_name: "First Aid Kit", category: "Medical", quantity: 3, unit: "kits", min_stock: 2, location: "Health Center", condition: "good", acquired_date: "2025-12-01", acquisition_cost: 2000, last_checked: "2026-03-01" },
  { id: "9", item_name: "Plastic Monobloc Chair", category: "Furniture", quantity: 50, unit: "pcs", min_stock: 30, location: "Multi-Purpose Hall", condition: "fair", acquired_date: "2023-05-15", acquisition_cost: 350, last_checked: "2026-02-15" },
  { id: "10", item_name: "Flashlight (Rechargeable)", category: "Equipment", quantity: 5, unit: "pcs", min_stock: 3, location: "Tanod Office", condition: "good", acquired_date: "2025-06-01", acquisition_cost: 500, last_checked: "2026-03-01" },
];

const categoriesFilter = ["All", "Furniture", "IT Equipment", "Office Supplies", "Equipment", "Medical"];

const formTabs = ["Item Info", "Details"];

function FormInput({ label, name, value, placeholder, required, type, error, onChange }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, options, required, error, onChange }: { label: string; name: string; value: string; options: string[]; required?: boolean; error?: string; onChange: (name: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => onChange(name, e.target.value)} className={cn("w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring", error ? "border-red-500" : "border-border")}>
        {options.map((o) => <option key={o} value={o}>{o || "\u2014 Select \u2014"}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, name, value, placeholder, rows, required, onChange }: { label: string; name: string; value: string; placeholder?: string; rows?: number; required?: boolean; onChange: (name: string, value: string) => void }) {
  return (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );
}

export default function InventoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showLowStock, setShowLowStock] = useState(false);
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{id: string; type: "success"|"error"|"warning"|"info"; title: string; message?: string}[]>([]);

  const addToast = useCallback((type: "success"|"error"|"warning"|"info", title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.item_name?.trim()) errors.item_name = "Item name is required";
    if (!form.category) errors.category = "Category is required";
    if (!form.quantity?.trim()) {
      errors.quantity = "Quantity is required";
    } else if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) {
      errors.quantity = "Must be a non-negative whole number";
    }
    if (!form.unit_cost?.trim()) {
      errors.unit_cost = "Unit cost is required";
    } else if (isNaN(Number(form.unit_cost)) || Number(form.unit_cost) <= 0) {
      errors.unit_cost = "Must be a positive number";
    }
    if (!form.condition) errors.condition = "Condition is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const filtered = mockItems.filter((i) => {
    if (search && !i.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "All" && i.category !== categoryFilter) return false;
    if (showLowStock && i.quantity > i.min_stock) return false;
    return true;
  });

  const lowStockCount = mockItems.filter((i) => i.quantity <= i.min_stock).length;
  const totalValue = mockItems.reduce((sum, i) => sum + i.acquisition_cost * i.quantity, 0);

  const openCreate = () => {
    setForm({});
    setFormErrors({});
    setFormTab(0);
    setShowCreate(true);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({
      item_name: item.item_name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      unit_cost: String(item.acquisition_cost),
      condition: item.condition === "good" ? "Good" : item.condition === "fair" ? "Fair" : item.condition === "poor" ? "Poor" : "New",
      location: item.location,
      date_acquired: item.acquired_date,
      reorder_level: String(item.min_stock),
    });
    setFormErrors({});
    setFormTab(0);
    setShowEdit(true);
    setActionMenu(null);
  };

  const handleFieldChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrors((e) => { const next = { ...e }; delete next[name]; return next; });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track barangay property and supplies"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Inventory" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => addToast("info", "Export Started", "Inventory report is being generated...")} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}><Plus className="h-4 w-4" /> Add Item</button>
          </div>
        }
      />

      {/* Mabini AI Insight */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-primary)", opacity: 0.15 }}>
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Inventory Alert</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            3 items below minimum stock level — reorder recommended. Office supplies category accounts for 45% of inventory value. 1 item marked &quot;poor&quot; condition needs replacement.
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/ai")} className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          Ask Mabini
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={mockItems.length} icon={<Package className="h-5 w-5" />} />
        <StatCard label="Low Stock" value={lowStockCount} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Categories" value={categoriesFilter.length - 1} icon={<Tag className="h-5 w-5" />} />
        <StatCard label="Total Value" value={`\u20B1${totalValue.toLocaleString()}`} icon={<Archive className="h-5 w-5" />} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
          {categoriesFilter.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowLowStock(!showLowStock)}
          className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors",
            showLowStock ? "border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" : "border-border hover:bg-muted text-muted-foreground")}>
          <AlertTriangle className="h-3 w-3" /> Low Stock Only
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Condition</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Value</th>
              <th className="w-10 px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No inventory items found</p>
                    <p className="text-xs text-muted-foreground mt-1">Add barangay property and supplies to track inventory levels and condition.</p>
                  </div>
                  <button onClick={() => openCreate()} className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}>
                    + Add Item
                  </button>
                </div>
              </td></tr>
            ) : (
              filtered.map((item) => {
                const isLow = item.quantity <= item.min_stock;
                return (
                  <tr key={item.id} className={cn("border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors", isLow && "bg-red-50/50 dark:bg-red-950/10")} onClick={() => setViewItem(item)}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{item.item_name}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant="muted">{item.category}</Badge></td>
                    <td className="px-4 py-3">
                      <span className={cn("text-sm font-medium", isLow ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                        {item.quantity} {item.unit}
                      </span>
                      {isLow && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.location}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.condition === "good" ? "success" : item.condition === "fair" ? "warning" : "danger"}>{item.condition}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">{"\u20B1"}{(item.acquisition_cost * item.quantity).toLocaleString()}</td>
                    <td className="px-2 py-3">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setActionMenu(actionMenu === item.id ? null : item.id)} className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                        {actionMenu === item.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
                            <button onClick={() => { setViewItem(item); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                            <button onClick={() => openEdit(item)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                            <button onClick={() => { setDeleteItem(item); setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View Item Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={viewItem?.item_name || ""} description={viewItem?.category || ""} size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setViewItem(null)}>Close</ModalButton><ModalButton variant="primary" onClick={() => { if (viewItem) { openEdit(viewItem); setViewItem(null); } }}>Edit Item</ModalButton></>}>
        {viewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={viewItem.condition === "good" ? "success" : viewItem.condition === "fair" ? "warning" : "danger"}>{viewItem.condition}</Badge>
              {viewItem.quantity <= viewItem.min_stock && <Badge variant="danger">Low Stock</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Quantity</p><p className="text-sm">{viewItem.quantity} {viewItem.unit} (min: {viewItem.min_stock})</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Location</p><p className="text-sm">{viewItem.location}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Unit Cost</p><p className="text-sm">{"\u20B1"}{viewItem.acquisition_cost.toLocaleString()}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Total Value</p><p className="text-sm">{"\u20B1"}{(viewItem.acquisition_cost * viewItem.quantity).toLocaleString()}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Acquired</p><p className="text-sm">{viewItem.acquired_date}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Last Checked</p><p className="text-sm">{viewItem.last_checked}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Item Form Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); }} title={showEdit ? "Edit Item" : "Add New Item"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary" onClick={() => { if (validateForm()) { addToast("success", showEdit ? "Item Updated" : "Item Added", showEdit ? `${form.item_name || "Item"} has been updated successfully.` : `${form.item_name || "Item"} has been added to inventory.`); setShowCreate(false); setShowEdit(false); } }}>{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput onChange={handleFieldChange} label="Item Name" name="item_name" value={form.item_name || ""} placeholder="e.g. Office Chair" required error={formErrors.item_name} />
            <FormSelect onChange={handleFieldChange} label="Category" name="category" value={form.category || ""} options={["", "Office Supplies", "Furniture", "Equipment", "Cleaning", "Medical", "Disaster Preparedness", "Others"]} required error={formErrors.category} />
            <FormInput onChange={handleFieldChange} label="Quantity" name="quantity" value={form.quantity || ""} placeholder="e.g. 10" type="number" required error={formErrors.quantity} />
            <FormSelect onChange={handleFieldChange} label="Unit" name="unit" value={form.unit || ""} options={["", "pcs", "box", "ream", "pack", "bottle", "gallon", "set"]} />
            <FormInput onChange={handleFieldChange} label="Unit Cost" name="unit_cost" value={form.unit_cost || ""} placeholder="e.g. 3500" type="number" required error={formErrors.unit_cost} />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormSelect onChange={handleFieldChange} label="Condition" name="condition" value={form.condition || ""} options={["", "New", "Good", "Fair", "Poor", "For Disposal"]} required error={formErrors.condition} />
              <p className="text-[10px] text-muted-foreground mt-1">Rate based on last physical inspection. Update after each inventory check.</p>
            </div>
            <FormInput onChange={handleFieldChange} label="Location" name="location" value={form.location || ""} placeholder="e.g. Storage Room" />
            <FormInput onChange={handleFieldChange} label="Date Acquired" name="date_acquired" value={form.date_acquired || ""} type="date" />
            <FormInput onChange={handleFieldChange} label="Supplier" name="supplier" value={form.supplier || ""} placeholder="e.g. Office Warehouse" />
            <div>
              <FormInput onChange={handleFieldChange} label="Serial Number" name="serial_number" value={form.serial_number || ""} placeholder="e.g. SN-12345" />
              <p className="text-[10px] text-muted-foreground mt-1">Barangay property number from the inventory logbook.</p>
            </div>
            <FormInput onChange={handleFieldChange} label="Reorder Level" name="reorder_level" value={form.reorder_level || ""} placeholder="e.g. 5" type="number" />
            <FormTextarea onChange={handleFieldChange} label="Notes" name="notes" value={form.notes || ""} placeholder="Additional notes about this item..." />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteItem(null); }} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => { setShowDelete(false); setDeleteItem(null); }}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => { addToast("success", "Item Deleted", `${deleteItem?.item_name || "Item"} has been removed from inventory.`); setShowDelete(false); setDeleteItem(null); }}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-semibold text-foreground">{deleteItem?.item_name}</span> ({deleteItem?.quantity} {deleteItem?.unit})? This item will be permanently removed from the inventory.
        </p>
      </Modal>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" style={{ maxWidth: 360 }}>
          {toasts.map((toast) => (
            <div key={toast.id} className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300",
              toast.type === "success" && "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800",
              toast.type === "error" && "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800",
              toast.type === "warning" && "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800",
              toast.type === "info" && "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800",
            )}>
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white",
                toast.type === "success" && "bg-green-500",
                toast.type === "error" && "bg-red-500",
                toast.type === "warning" && "bg-amber-500",
                toast.type === "info" && "bg-blue-500",
              )}>
                {toast.type === "success" ? "\u2713" : toast.type === "error" ? "\u2715" : toast.type === "warning" ? "!" : "i"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold",
                  toast.type === "success" && "text-green-800 dark:text-green-200",
                  toast.type === "error" && "text-red-800 dark:text-red-200",
                  toast.type === "warning" && "text-amber-800 dark:text-amber-200",
                  toast.type === "info" && "text-blue-800 dark:text-blue-200",
                )}>{toast.title}</p>
                {toast.message && <p className={cn(
                  "text-xs mt-0.5",
                  toast.type === "success" && "text-green-600 dark:text-green-300",
                  toast.type === "error" && "text-red-600 dark:text-red-300",
                  toast.type === "warning" && "text-amber-600 dark:text-amber-300",
                  toast.type === "info" && "text-blue-600 dark:text-blue-300",
                )}>{toast.message}</p>}
              </div>
              <button onClick={() => dismissToast(toast.id)} className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <span className="text-xs text-muted-foreground">{"\u2715"}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
